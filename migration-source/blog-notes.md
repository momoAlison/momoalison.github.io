---
weight: 999
title: "Lotus Docs Guide"
description: "Quick reference for Lotus Docs: commands, shortcodes, and configuration."
icon: "menu_book"
date: "2026-02-10T20:32:05+01:00"
lastmod: "2026-02-10T20:32:05+01:00"
draft: true
toc: true
---

## 🔗 Official Resources

When in doubt, check the official documentation:

* **Official Docs**: [lotusdocs.dev](https://lotusdocs.dev/)
* **GitHub Repo**: [colinwilson/lotusdocs](https://github.com/colinwilson/lotusdocs)
* **Icons**: [Google Material Symbols](https://fonts.google.com/icons) (Use these names for the `icon` field in Front Matter)

---

## ⚡️ Common Commands

Open your terminal in the project root:

### 1. Local Preview 👀
Start a local server to see your changes in real-time at `http://localhost:1313`.

```bash
hugo server
# preview draft
hugo server -D
```

### 2. New Content 📄
Create a new markdown file with pre-filled Front Matter.

```Bash
# Create a new note inside the coding folder
hugo new docs/coding/vue-notes.md
```