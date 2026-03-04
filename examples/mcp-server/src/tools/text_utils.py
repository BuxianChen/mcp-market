"""Text utility tools for MCP Server"""


def to_upper_case(text: str) -> str:
    """Convert text to uppercase.

    Args:
        text: Input text

    Returns:
        Text in uppercase
    """
    return text.upper()


def to_lower_case(text: str) -> str:
    """Convert text to lowercase.

    Args:
        text: Input text

    Returns:
        Text in lowercase
    """
    return text.lower()


def reverse_text(text: str) -> str:
    """Reverse the text.

    Args:
        text: Input text

    Returns:
        Reversed text
    """
    return text[::-1]


def word_count(text: str) -> int:
    """Count words in text.

    Args:
        text: Input text

    Returns:
        Number of words
    """
    return len(text.split())
