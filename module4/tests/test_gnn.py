"""GNN tests: pair score is symmetric; only training interactions enter the message graph."""
import pandas as pd
import pytest

torch = pytest.importorskip("torch")
pytest.importorskip("torch_geometric")

from src.model.gnn import DDIGAT, predict  # noqa: E402
from src.model.graph import GraphInputs, message_graph  # noqa: E402


def _toy():
    D, G, V = 6, 3, 1
    gi = GraphInputs(x_drug=torch.rand(D, 10), x_var=torch.rand(V, 4), n_drugs=D, n_genes=G, n_vars=V,
                     drug_row={f"DB{i}": i for i in range(D)}, drug_ids=[f"DB{i}" for i in range(D)],
                     gene_symbols=["G0", "G1", "G2"], variant_names=["V0"],
                     static_ei=torch.tensor([[0, 6, 6, 9], [6, 0, 9, 6]]), static_et=torch.tensor([88, 90, 92, 93]))
    pos = pd.DataFrame({"a": ["DB0", "DB1"], "b": ["DB2", "DB3"], "mechanism_id": [5, -1]})
    return gi, pos


def test_message_graph_contains_only_given_pairs():
    gi, pos = _toy()
    ei, et = message_graph(gi, pos)
    ddi = ei[:, gi.static_ei.shape[1]:]
    assert ddi.shape[1] == 4                                   # 2 pairs x 2 directions
    assert set(map(tuple, ddi.t().tolist())) == {(0, 2), (2, 0), (1, 3), (3, 1)}
    assert set(et[gi.static_ei.shape[1]:].tolist()) == {5, 87}  # mechanism type / DDInter-only type


def test_score_is_symmetric_and_mc_dropout_runs():
    gi, pos = _toy()
    model = DDIGAT(drug_in=10, var_in=4, n_genes=3, n_vars=1, hidden=16, heads=2, layers=2)
    ei, et = message_graph(gi, pos)
    ia, ib = torch.tensor([0, 4]), torch.tensor([5, 1])
    p1, _ = predict(model, gi, ei, et, ia, ib)
    p2, _ = predict(model, gi, ei, et, ib, ia)
    assert torch.allclose(p1, p2, atol=1e-6)
    mean, std = predict(model, gi, ei, et, ia, ib, mc_samples=5)
    assert mean.shape == std.shape == (2,)
