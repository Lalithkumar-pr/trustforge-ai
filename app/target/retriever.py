import re
from typing import List, Dict, Tuple
from app.schemas.target import RetrievedContext
from app.target.policies import get_all_policies, PolicyDocument

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
    "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", 
    "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", 
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", 
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", 
    "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", 
    "with", "would", "you", "your", "yours", "yourself", "yourselves"
}

def tokenize(text: str) -> List[str]:
    words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]

class PolicyRetriever:
    """
    Keyword-based retrieval over policy documents.
    Scores relevance based on query term frequency, title matches, and requirement overlap.
    """
    def __init__(self, policies: List[PolicyDocument] = None):
        self.policies = policies or get_all_policies()

    def retrieve(self, query: str, top_k: int = 3, threshold: float = 0.05) -> List[RetrievedContext]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        results: List[Tuple[float, RetrievedContext]] = []

        for policy in self.policies:
            # Score against title, requirements, and individual content lines
            title_tokens = set(tokenize(policy.title))
            req_tokens = set(tokenize(policy.important_requirements))
            
            # Paragraph / sentence extraction for exact excerpt
            paragraphs = [p.strip() for p in policy.content.split("\n") if p.strip()]
            
            best_para_score = 0.0
            best_excerpt = paragraphs[0] if paragraphs else policy.content[:200]

            # Extract all matching paragraphs or full content if document is highly relevant
            scored_paras = []
            for para in paragraphs:
                para_tokens = tokenize(para)
                if not para_tokens:
                    continue
                overlap = sum(1 for q in query_tokens if q in para_tokens)
                score = overlap / (len(para_tokens) ** 0.5 + 1.0)
                scored_paras.append((score, para))

            scored_paras.sort(key=lambda x: x[0], reverse=True)
            top_paras = [p[1] for p in scored_paras if p[0] > 0][:3]
            best_excerpt = "\n".join(top_paras) if top_paras else (policy.important_requirements or policy.content[:300])
            best_para_score = scored_paras[0][0] if scored_paras else 0.0

            # Document-level score
            title_overlap = sum(2.5 for q in query_tokens if q in title_tokens)
            req_overlap = sum(1.5 for q in query_tokens if q in req_tokens)
            total_doc_score = best_para_score * 3.0 + title_overlap + req_overlap
            
            normalized_score = min(round(total_doc_score / (len(query_tokens) + 2.0), 3), 1.0)

            if normalized_score >= threshold:
                results.append((
                    normalized_score,
                    RetrievedContext(
                        source_id=policy.doc_id,
                        title=policy.title,
                        excerpt=best_excerpt,
                        relevance_score=normalized_score
                    )
                ))

        # Sort descending by relevance score
        results.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in results[:top_k]]

retriever = PolicyRetriever()

