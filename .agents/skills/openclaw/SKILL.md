---
name: openclaw
description: OpenClaw CLI and Multi-Channel AI Gateway for terminal automation, MCP tools, and WhatsApp/Telegram/Discord/Slack integration.
---

# OpenClaw Skill

OpenClaw is an open-source autonomous agent harness and multi-channel messaging gateway that runs on your local machine.

## CLI Quick Reference

### 1. General & Status
- `openclaw status`: View channel connectivity, recent sessions, and model health.
- `openclaw doctor`: Run health checks and repair configurations (`--fix`).
- `openclaw models status`: Verify configured LLM providers (OpenAI, Gemini, Anthropic, Ollama, etc.).

### 2. Channels (WhatsApp, Telegram, Discord, Slack)
- `openclaw channels list`: List connected chat platforms.
- `openclaw channels add`: Add a new channel (e.g. WhatsApp via QR code, Telegram bot token).
- `openclaw channels status`: Inspect real-time status of connected accounts.
- `openclaw message send --channel <channel> --target <phone/chatId> --message "text"`: Send outbound messages programmatically.

### 3. Agent Execution & Gateway
- `openclaw agent --message "Instrucción" --deliver`: Execute an autonomous agent turn.
- `openclaw gateway run`: Start the local WebSocket Gateway service.
- `openclaw daemon start`: Start OpenClaw background service.

### 4. MCP Server (Model Context Protocol)
- `openclaw mcp serve`: Expose OpenClaw tools and messaging over MCP stdio.
- `openclaw mcp list`: List configured MCP servers inside OpenClaw.
- `openclaw mcp add <name> -- <command> [args]`: Add an external MCP server into OpenClaw.

### 5. Integration with Bajo Zero
When integrating with Bajo Zero:
- Use OpenClaw Gateway to listen and dispatch WhatsApp notifications for new inspection assignments (`tasks` table).
- Query technicians and task details from Supabase when handling incoming messages.
