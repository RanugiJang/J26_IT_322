"""
Module 2 — Adaptive Daily Plan via DQN Reinforcement Learning
Personalised adaptation loop based on patient feedback:
  Reward: Done (+1), Too Hard (-1), Skipped (-0.5)
State: [action_idx, consecutive_days, last_reward, cvd_risk, fatigue, tolerance, streak]
Actions:
  0: '3-minute walk', 1: '5-minute walk', 2: '7-minute walk',
  3: '10-minute walk', 4: '15-minute walk', 5: '20-minute walk'
"""

import os
import json
import torch
import torch.nn as nn
import numpy as np


class DQNetwork(nn.Module):
    def __init__(self, state_size=7, action_size=6):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_size, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, action_size)
        )

    def forward(self, state):
        return self.network(state)


class DQNAgent:
    ACTIONS = {
        0: '3-minute walk',
        1: '5-minute walk',
        2: '7-minute walk',
        3: '10-minute walk',
        4: '15-minute walk',
        5: '20-minute walk'
    }

    ACTION_MINUTES = {
        0: 3, 1: 5, 2: 7, 3: 10, 4: 15, 5: 20
    }

    FEEDBACK_REWARDS = {
        'Done': 1.0,
        'Too Hard': -1.0,
        'Skipped': -0.5
    }

    def __init__(self, model_path="module2/models/dqn_adaptive_exercise_final.pth", lr=1e-3, gamma=0.95):
        self.model_path = model_path
        self.state_size = 7
        self.action_size = 6
        self.gamma = gamma

        self.model = DQNetwork(self.state_size, self.action_size)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        self.criterion = nn.MSELoss()

        if os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, path):
        checkpoint = torch.load(path, map_location='cpu')
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            self.model.load_state_dict(checkpoint['model_state_dict'])
        elif isinstance(checkpoint, dict):
            # Check if dict directly matches weights
            try:
                self.model.load_state_dict(checkpoint)
            except Exception:
                pass
        self.model.eval()

    def save_model(self, path=None):
        if path is None:
            path = self.model_path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'state_size': self.state_size,
            'action_size': self.action_size,
            'exercise_actions': self.ACTIONS,
            'feedback_state': self.FEEDBACK_REWARDS
        }, path)

    def build_state_tensor(self, current_action_idx, day_num, last_feedback, cvd_risk, fatigue=0.2, tolerance=0.5, streak=0):
        reward_val = self.FEEDBACK_REWARDS.get(last_feedback, 0.0)
        state_vec = np.array([
            float(current_action_idx) / 5.0,
            float(day_num % 30) / 30.0,
            reward_val,
            float(cvd_risk),
            float(fatigue),
            float(tolerance),
            float(streak) / 10.0
        ], dtype=np.float32)
        return torch.FloatTensor(state_vec).unsqueeze(0)

    def select_action(self, state_tensor, epsilon=0.0):
        """Epsilon-greedy action selection."""
        if np.random.rand() < epsilon:
            return np.random.randint(self.action_size)

        self.model.eval()
        with torch.no_grad():
            q_values = self.model(state_tensor)
            return int(torch.argmax(q_values, dim=1).item())

    def update_from_feedback(self, current_action_idx, feedback, cvd_risk, day_num=1, fatigue=0.2, streak=0):
        """
        Receives patient feedback, computes reward, updates Q-network online,
        and returns next adapted exercise recommendation.
        """
        reward = self.FEEDBACK_REWARDS.get(feedback, 0.0)

        # Build current state
        state_t = self.build_state_tensor(
            current_action_idx, day_num, feedback, cvd_risk, fatigue=fatigue, streak=streak
        )

        # Clinical boundary adjustment logic
        if feedback == 'Too Hard':
            # Demote intensity to protect pre-surgery CVD patient
            next_action_idx = max(0, current_action_idx - 2 if current_action_idx >= 3 else current_action_idx - 1)
            new_streak = 0
            new_fatigue = min(1.0, fatigue + 0.3)
        elif feedback == 'Done':
            # Gradual progressive overload: promote if consistent
            next_action_idx = min(self.action_size - 1, current_action_idx + 1)
            new_streak = streak + 1
            new_fatigue = max(0.1, fatigue - 0.1)
        else: # Skipped
            next_action_idx = max(0, current_action_idx - 1)
            new_streak = 0
            new_fatigue = fatigue

        next_state_t = self.build_state_tensor(
            next_action_idx, day_num + 1, feedback, cvd_risk, fatigue=new_fatigue, streak=new_streak
        )

        # One-step TD update
        self.model.train()
        q_current = self.model(state_t)[0, current_action_idx]
        with torch.no_grad():
            q_next_max = torch.max(self.model(next_state_t))
            q_target = reward + self.gamma * q_next_max

        loss = self.criterion(q_current, q_target)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        return {
            'previous_action': self.ACTIONS[current_action_idx],
            'feedback_received': feedback,
            'reward_assigned': reward,
            'adapted_action_idx': next_action_idx,
            'adapted_exercise': self.ACTIONS[next_action_idx],
            'recommended_minutes': self.ACTION_MINUTES[next_action_idx],
            'td_loss': float(loss.item()),
            'adaptation_message': (
                f"Cardiac workload scaled down to {self.ACTIONS[next_action_idx]} to avoid cardiovascular strain."
                if feedback == 'Too Hard' else
                f"Heart endurance improving! Advanced to {self.ACTIONS[next_action_idx]}."
                if feedback == 'Done' else
                f"Gentle reset to {self.ACTIONS[next_action_idx]} to re-establish routine."
            )
        }


if __name__ == '__main__':
    agent = DQNAgent()

    print("=== Testing DQN Adaptive Learning (Simulating Nimal's Progression) ===")
    # Nimal starts with 10-minute walk (action 3)
    curr_action = 3
    print(f"Day 1: Prescribed {agent.ACTIONS[curr_action]}")

    # Patient reports 'Too Hard'
    print("\nPatient Feedback: 'Too Hard' -> DQN Reward: -1")
    res1 = agent.update_from_feedback(curr_action, 'Too Hard', cvd_risk=0.75, day_num=1)
    print(f"Day 2 Adapted Plan: {res1['adapted_exercise']} ({res1['adaptation_message']})")

    # Patient does 3 min walk and reports 'Done'
    curr_action = res1['adapted_action_idx']
    print(f"\nPatient Feedback: 'Done' -> DQN Reward: +1")
    res2 = agent.update_from_feedback(curr_action, 'Done', cvd_risk=0.75, day_num=2)
    print(f"Day 3 Adapted Plan: {res2['adapted_exercise']} ({res2['adaptation_message']})")

    # Patient does another and reports 'Done'
    curr_action = res2['adapted_action_idx']
    print(f"\nPatient Feedback: 'Done' -> DQN Reward: +1")
    res3 = agent.update_from_feedback(curr_action, 'Done', cvd_risk=0.70, day_num=3)
    print(f"Day 4 Adapted Plan: {res3['adapted_exercise']} ({res3['adaptation_message']})")
