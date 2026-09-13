def build_context(results):

    if not results:
        return ""

    # --------------------------------------------------
    # Remove exact duplicate chunks
    # --------------------------------------------------

    unique_chunks = {}

    for result in results:

        source_type = result.get(
            "source_type",
            "pdf"
        )

        if source_type == "video":

            key = (
                "video",
                result.get("start"),
                result.get("end"),
                result["text"].strip()
            )

        else:

            key = (
                "pdf",
                result.get("page_number"),
                result["text"].strip()
            )

        unique_chunks[key] = result

    results = list(
        unique_chunks.values()
    )

    # --------------------------------------------------
    # Sort results
    # --------------------------------------------------
    #
    # PDF:
    #   sorted by page number
    #
    # Video:
    #   sorted by start timestamp
    #
    # This prevents None vs int comparison.
    # --------------------------------------------------

    def sort_key(result):

        source_type = result.get(
            "source_type",
            "pdf"
        )

        if source_type == "video":

            return (
                1,
                result.get("start") or 0,
                result.get("chunk_index", 0)
            )

        else:

            return (
                0,
                result.get("page_number") or 0,
                result.get("chunk_index", 0)
            )

    results.sort(
        key=sort_key
    )

    # --------------------------------------------------
    # Build context
    # --------------------------------------------------

    context_parts = []

    current_source = None

    for result in results:

        source_type = result.get(
            "source_type",
            "pdf"
        )

        # ----------------------------------------------
        # VIDEO
        # ----------------------------------------------

        if source_type == "video":

            start = result.get(
                "start"
            )

            end = result.get(
                "end"
            )

            context_parts.append(
                f"\n========== VIDEO "
                f"{start:.2f}s - {end:.2f}s ==========\n"
            )

        # ----------------------------------------------
        # PDF
        # ----------------------------------------------

        else:

            page_number = result.get(
                "page_number"
            )

            if page_number != current_source:

                context_parts.append(
                    f"\n========== PAGE "
                    f"{page_number} ==========\n"
                )

                current_source = page_number

        context_parts.append(
            result["text"].strip()
        )

    return "\n".join(
        context_parts
    )
