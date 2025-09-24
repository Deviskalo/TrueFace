from backend.utils import get_embedding_from_image, cosine_similarity


def test_embedding_and_similarity():
    img = b"a" * 256
    emb = get_embedding_from_image(img)
    assert emb is not None
    emb2 = get_embedding_from_image(img)
    assert emb2 is not None
    # same image should give identical embedding (deterministic stub)
    assert emb == emb2

    # similarity to itself is ~1.0
    sim = cosine_similarity(emb, emb2)
    assert sim > 0.999
