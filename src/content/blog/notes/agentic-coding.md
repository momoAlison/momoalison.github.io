---
title: "Agentic Coding"
description: "Notes on how coding agents work, context management, parallel agents with git worktrees, and subagents, from MIT's Missing Semester lecture, with Claude Code as the example tool."
published: 2026-10-29
collection: notes
tags: [Learning Note]
draft: false
---

These are my notes from the Agentic Coding lecture of MIT's Missing Semester. Most of the introductory concepts are simple; most of my notes are on parallel agents and subagents.

**Study Resource:**
[Missing Semester 2026: Agentic Coding](https://missing.csail.mit.edu/2026/agentic-coding/)

---

## **How Coding Agents Work**

A coding agent has two parts:

- **Large Language Model (LLM):** does the reasoning and decides what to do next.
- **Agent harness (scaffolding):** the tools, execution loop, context management, and permissions that let the LLM actually act on your project.

---

## **Common Coding Agent Features**

| Feature | Purpose |
|---|---|
| Reusable Prompts / Skills | Reuse instructions and specialized workflows |
| MCP | Connect agents to external tools and services |
| Context Management | Work within a limited context window |
| Parallel Agents | Run multiple tasks at the same time |
| Subagents | Delegate focused tasks to specialized agents |
| CLAUDE.md / AGENTS.md | Store project-level instructions and conventions |

### Context Management

Claude Code's built-in commands:

- `/clear`: start a new conversation with a fresh context.
- `/compact`: summarize the conversation history to reduce context usage.
- `/rewind`: go back to an earlier checkpoint, optionally restoring code changes too.

Other techniques:

- `CLAUDE.md`: persistent project instructions that are loaded at the start of each session.
- Skills: specialized instructions that are only loaded when relevant.
- Subagents: keep a task's working context out of the main conversation.

All of these do the same job in different ways: they decide what goes into the context window, and when. `CLAUDE.md` is always loaded, a skill is loaded on demand, and a subagent's working context never reaches the main conversation (only its summary does).

---

## **Parallel Coding with Git Worktrees**

### Branch vs. Worktree

**A git branch isolates development history; a git worktree isolates the working directory.**

A branch does not create a separate physical copy of the project. If two coding agents run in the same directory, they can overwrite each other's changes or interfere with each other's git operations, even if each one thinks it is "on its own branch".

A worktree gives you several working directories that share one repository, each with a different branch checked out:

```bash
git worktree add ../preword-quiz -b feature/quiz
git worktree add ../preword-achievements -b feature/achievements
```

Result:

```text
Preword/                 → main
preword-quiz/            → feature/quiz
preword-achievements/    → feature/achievements
```

Each agent can now edit files and make commits independently.

Two details I checked in a throwaway repo:

- **They share one repository.** The new directory's `.git` is a small file pointing back to the main repo, not a full copy. Commits and branches are shared; only the working files and `HEAD` are separate.
- **One branch, one worktree.** Checking out `feature/quiz` anywhere else fails with `fatal: 'feature/quiz' is already used by worktree`, so two agents can't end up on the same branch by accident.

### Claude Code Support

CLI:

```bash
claude --worktree quiz
claude --worktree achievements
```

(`-w` is the short form; the name is optional.)

Claude Code Desktop can also isolate sessions in a worktree automatically for git projects. Whether a given session is actually isolated depends on its mode and configuration, so it's worth checking rather than assuming:

```bash
git worktree list
```

**Key takeaway:** worktrees keep agents out of each other's way while they work, but they don't get rid of merge conflicts. You still have to merge the branches and test the combined result.

---

## **Subagents**

### What Is a Subagent?

A subagent is a specialized agent that a parent agent calls to complete a focused task. It has its own context window, and can also have its own:

- System instructions
- Tool permissions
- Model configuration
- Responsibilities

```text
Main Agent
   │
   ├── Explore Subagent
   │      └── Analyze project architecture
   │
   └── Review Subagent
          └── Review code quality
```

The subagents return their results to the main agent, which carries on with the overall task.

### Why Use Subagents?

The main benefit is **context isolation**.

Instead of the main agent reading 20 files itself, it can hand repository exploration to a subagent. The subagent reads the files in its own context and returns a short summary, so the parent conversation only pays for the summary, not the 20 files.

The cost is extra model calls and coordination overhead. And the summary is lossy: if the main agent later needs a detail the subagent didn't report, it has to go and read the file anyway.

**Important:** context isolation does not mean filesystem isolation. A subagent may share the parent's working directory, so a subagent that edits files can conflict with its parent just like two agents in one directory can.

### Creating a Subagent in Claude Code

Option 1: the built-in command.

```text
/agents
```

Option 2: a configuration file.

```text
.claude/agents/code-reviewer.md
```

Example:

```markdown
---
name: code-reviewer
description: Review code for bugs and maintainability
tools: Read, Grep, Glob
model: sonnet
---

Review the requested code changes.

Focus on:
- Potential bugs
- Architecture issues
- Missing tests

Do not modify files.
Return actionable findings.
```

The `tools` line does more than "Do not modify files": the prompt only asks the model not to edit, while the tool list leaves it no way to. If a rule really matters, enforce it with permissions, not just the prompt.

---

## **Takeaway**

Agentic coding is not just about generating code faster. Using AI well in software engineering means controlling task boundaries, context, architecture, testing, and integration.

The goal is to understand and evaluate AI-generated software, not just to produce it.

