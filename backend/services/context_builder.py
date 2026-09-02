def build_context(results):

    if not results:
        return ""

    # Remove exact duplicate chunks
    unique_chunks = {}

    for result in results:

        key = (
            result["page_number"],
            result["text"].strip()
        )

        unique_chunks[key] = result

    results = list(unique_chunks.values())

    # --------------------------------------------------
    # Sort by original PDF order
    # --------------------------------------------------
    #
    # First: page number
    # Second: original chunk position
    #
    results.sort(
        key=lambda x: (
            x["page_number"],
            x.get("chunk_index", 0)
        )
    )

    context_parts = []

    current_page = None

    for result in results:

        page_number = result["page_number"]

        # New page
        if page_number != current_page:

            context_parts.append(
                f"\n========== PAGE {page_number} ==========\n"
            )

            current_page = page_number

        context_parts.append(
            result["text"].strip()
        )

    return "\n".join(context_parts)
