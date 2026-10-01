# Official self-hosted server. There is no upstream image; the release is one binary.
# https://github.com/supermemoryai/supermemory/releases/tag/server-v0.0.8
FROM debian:bookworm-slim

ARG SUPERMEMORY_VERSION=0.0.8
ARG TARGETARCH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/supermemory

RUN set -eu; \
  case "$TARGETARCH" in \
    amd64) PLATFORM=linux-x64 ;; \
    arm64) PLATFORM=linux-arm64 ;; \
    *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
  esac; \
  BASE="https://github.com/supermemoryai/supermemory/releases/download/server-v${SUPERMEMORY_VERSION}"; \
  curl -fsSL "$BASE/manifest.json" -o /tmp/manifest.json; \
  curl -fsSL "$BASE/supermemory-server-${PLATFORM}" -o /opt/supermemory/supermemory-server; \
  EXPECTED="$(grep -A2 "\"${PLATFORM}\"" /tmp/manifest.json | grep -oE '[a-f0-9]{64}' | head -n 1)"; \
  test -n "$EXPECTED"; \
  echo "${EXPECTED}  /opt/supermemory/supermemory-server" | sha256sum -c -; \
  chmod 755 /opt/supermemory/supermemory-server; \
  rm /tmp/manifest.json

ENV PORT=6767 \
  SUPERMEMORY_DATA_DIR=/data \
  SUPERMEMORY_EMBEDDING_PROVIDER=local \
  SUPERMEMORY_DISABLE_TELEMETRY=1

EXPOSE 6767
VOLUME ["/data"]

HEALTHCHECK --interval=5s --timeout=3s --start-period=120s --retries=30 \
  CMD curl -sS -o /dev/null http://127.0.0.1:6767/ || exit 1

ENTRYPOINT ["/opt/supermemory/supermemory-server"]
