# Projects


## LinkPulse — URL Shortener with Analytics Dashboard
**Type:** Portfolio Project (in progress)
**Stack:** Next.js (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth.js
**Live demo:** https://linkpulse-phi.vercel.app
**Demo credentials:** email: test@gmail.com / password: 123456789

### What It Is
A production-grade URL shortening service with a full analytics layer — not just a link shortener, but a dashboard giving users insight into their link performance.

### Features
- Shorten any URL to a custom short link
- Track clicks, geographic data, referrers, and device types
- Analytics dashboard with charts and metrics per link
- User authentication with NextAuth.js
- Middleware-based redirect handling for performance

### Why It Matters
This project was designed from the ground up with architecture first — three-table schema, request flow mapping, and middleware structure were all planned before a single line of code was written. It demonstrates Riad's preference for thoughtful engineering over fast hacking.

---

## AI Portfolio Agent
**Type:** Personal Project (in progress)
**Stack:** Next.js (App Router), TypeScript, Drizzle ORM, Neon PostgreSQL + pgvector, Voyage AI (embeddings), Claude API, Vercel AI SDK

### What It Is
This very application. A conversational AI agent that acts as Riad's interactive portfolio — allowing recruiters and developers to ask natural language questions about his background, skills, and projects, and receive grounded, accurate answers.

### Architecture
- **RAG pipeline** (Retrieval-Augmented Generation): knowledge base is chunked, embedded with Voyage AI, and stored as vectors in Neon PostgreSQL using pgvector
- On each user query: the query is embedded, a similarity search retrieves the most relevant KB chunks, and these are injected into the LLM context
- Bilingual: responds in French or English based on the user's language
- Streaming responses via Vercel AI SDK

---

## TaskFlow — Project Management Platform
**Type:** Personal / Academic Project
**Stack:** React, TypeScript, NestJS, PostgreSQL, React Native, AWS
**GitHub:** https://github.com/sacroudr/Taskflow

### What It Is
A full-featured project management and team collaboration platform — think a custom-built alternative to tools like Trello or Asana.

### Features
- **Task planning** — create, assign, and track tasks across projects
- **Team tracking** — monitor team members' progress and workload
- **Dashboard** — visual overview of project status and metrics
- **Real-time notifications** — instant updates when tasks change or deadlines approach
- **Real-time chat** — live messaging between team members, built into the platform

### Technical Highlights
- Built with NestJS on the backend (TypeScript, REST API)
- React frontend with TypeScript
- PostgreSQL for data persistence
- React Native mobile version
- Deployed on AWS
- Real-time features (notifications + chat) implemented with WebSockets

---

## Spring Boot Todo App
**Type:** Learning Project
**Stack:** Java 21, Spring Boot, Maven, Neon PostgreSQL, Spring Security, BCrypt

### What It Is
A full-stack Todo application built as a structured deep-dive into the Java/Spring Boot ecosystem.

### Features
- Complete CRUD for tasks
- User authentication with Spring Security and BCrypt password hashing
- CSRF protection
- Audit log — every action (create, update, delete) is logged with timestamp and user
- Connected to Neon serverless PostgreSQL

### Why It Matters
Demonstrates that Riad is not limited to the JS/TS ecosystem. He actively expands into strongly-typed, enterprise-grade backend frameworks.

---

## Heating Simulation & Control Interface
**Type:** Academic / Embedded Systems Project
**Stack:** C, STM32 Microcontroller

### What It Is
A graphical interface for simulating and controlling a heating system, developed directly on an STM32 microcontroller in C. The system was validated through simulation before hardware deployment.

### Why It Matters
Proves that Riad's engineering background extends beyond web development into low-level embedded systems — a rare and valuable additional dimension for a full-stack engineer.