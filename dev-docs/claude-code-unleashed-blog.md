---
url: https://ymichael.com/2025/07/15/claude-code-unleashed.html?utm_source=perplexity
scraped_date: 2025-07-25
domain: ymichael.com
title: Claude Code Unleashed - Background Agents and Parallel Development
category: claude-code-community
source: Michael Yang's Blog
author: Michael Yang
tags: [terragon, background-agents, parallel-development, workflow-optimization]
---

# Claude Code Unleashed - Background Agents and Parallel Development

For the past two months, I've been obsessively dogfooding background agents while building [Terragon](https://www.terragonlabs.com/). This quickly became an experiment in unleashing Claude Code from the constraints of local development.

The breakthrough wasn't just using AI to write code faster. It was realizing what becomes possible when you:

- Make it trivially easy to kick off new agents
- Free these agents from your local machine
- Run an unlimited number of them at the same time

I've landed on a hybrid approach and I want to share and document what I've learned. I'm sure this will continue to evolve and change over time.

## Claude Code & Claude Max

If you haven't tried Claude Code yet, you're missing out. Almost every conversation about claude code is either about how good it is or how expensive it is.

![Claude Code Interface](https://ymichael.com/static/img/blog/claude-code.jpg)

_Last I checked, just saying "Hello" to claude code costs $0.30!_

Once you start to dig into the cost of claude code, you'll inevitability hear about "Claude Max" - which is Anthropic's subscription so you pay a monthly fee for some amount of usage. If you pay for the $200/month plan you get effectively unlimited usage. There are still rate limits but they are very generous.

On a typical day, I'd otherwise pay almost $100 without my claude max subscription. So in a strange way, Claude max is cheap! (Which also happens to be the other flavor of conversation people have about claude code.)

![Claude Usage](https://ymichael.com/static/img/blog/claude-code-usage.png)

I highly recommend getting a claude max subscription. Not having to worry about rate limits, per-use cost, whether you should use sonnet or opus is truly a game changer. With Max, I stopped thinking in terms of "is this a task that's good for claude code? Is this a task for sonnet or opus?" Instead, it became "How can I offload more work to claude code?" That mental shift alone was worth the price.

## How do I run more than one agent at a time?

Once you embrace using claude code, you'll quickly want to run more than one agent at a time. Part of the reason why claude code is so good is that it takes the time to understand the codebase and the context of the task at hand. This can be frustrating and slow if you're literally watching it code.

As recommended by their docs, I started to use multiple git worktrees to parallelize the agent. This was nice for quick changes but quickly became a pain once you try to run more than two agents in parallel because the management overhead becomes brutal.

You can't help but feel like you're constantly juggling:

- What was I doing?
- Which branch am I on?
- Which tab was this again?
- What was the context of this change?
- Which IDE window corresponds to this worktree?

**Instead of feeling more productive, you start to feel like you're juggling too many things at once doing everything poorly instead.**

Most projects also share global resources like docker containers, so running tests / development environments in multiple worktrees simultaneously becomes a pain or would require much more setup.

Over time, as I used Claude Code more and more, I also started to get annoyed in non `--dangerously-skip-permissions` mode. I get it. You probably don't want the agent to yolo run `rm -rf` on your local machine, but all too often, I'd think that the agent was working only to find that it was waiting for me to approve a simple `find` command. **Yes, run the find command please and don't ask me again.**

## Enter [Terragon](https://www.terragonlabs.com/)

[Terragon](https://www.terragonlabs.com/) is a product we're building that solves the problem of managing multiple Claude Code agents without losing your mind. **It runs Claude Code in the cloud.** You give it a task, it works on it, and creates a PR. It can do this while you're sleeping, on the go, or sending it more tasks.

![Terragon Dashboard](https://ymichael.com/static/img/blog/terragon-dashboard.png)

For every task, terry spins up a fresh environment, clones the repo, creates a branch, and gets to work. Part of the magic is task creation becomes so cheap and seamless that you can simply focus on the task at hand.

- A hard to repro bug? Ask terry to investigate it
- A new feature idea? Ask terry to prototype it
- Idea for code clean up? Ask terry to do it

## My Current Workflow

My current workflow is a combination of local and background agents on terragon. In the past week, I've averaged ~30 tasks running on terragon a day. Locally, I'm often testing and finishing up a task that was started by a background agent.

**What happens on terragon**

- Almost every task starts here

**What happens locally**

- Reviewing changes, testing, small tweaks to existing PRs
- Finishing up and testing work done by background agents
- Starting scaffolding for a background agent (I'll create some TODOs, push them up, then ask an agent to finish it)
- Tasks that don't make sense for background agents to tackle (eg. requiring a lot of back and forth, things that I've found agents to not be great at yet.)

I've found that background agents excel at the following tasks and use cases:

- **Explore tasks**: "Prototype this approach so I can take a quick look." Sometimes I never merge these. I just read them like engineering proposals to feed into my next prompt / thinking about how to approach this larger task.
- **One-shot tasks**: Easy cleanup work. E.g removing feature flags, fixing small bugs, adding test coverage, changing well-tested behavior.
- **Boilerplate-heavy tasks**: Either building off scaffolding I've created, or following established patterns in the codebase. For example, agents are great for creating internal pages.
- **Context-heavy debugging**: "Can you investigate this bug report where a user ran into...?" Background agents excel here because investigation involves reading tons of code, but the fix is often just a few lines.

## A Typical Day

Once you adopt a background agent heavy workflow, you'll notice that a lot more time is spent context switching between tasks. Instead of doing one thing at a time, you're doing multiple things in parallel. If you're not careful or don't have a good system in place, you'll actually end up doing much worse work and getting less done.

I've found that the key to success here is to have a good system in place for managing your tasks. Of course, as before you'll need to exercise discipline and judgement on where to spend your time. Just because you can fire out 100 tasks for the agents to work on doesn't mean it'll be the best use of your time.

I start my morning by firing off a bunch of tasks for the day. Occasionally, I do this on my commute from my phone using voice to dictate tasks. This is the most important part of the day as I'm effectively deciding how I'm going to spend my time for the day.

Throughout the day, I spend most of my time "clearing" these tasks and reviewing the agent's work. On Terragon, we have a `terry` cli that makes it easy to pull down the remote environment and conversation to continue test and review the changes locally.

At the end of the day, I often would have "inbox zero" for tasks. Most of the tasks created earlier and through the day would be merged or closed. The terragon dashboard is how I keep track of what's left to do for the day.

## Some interesting examples

Obsessively dogfooding terragon has been really interesting! Here are some things that have stuck with me:

- We had a race condition in terragon where error messages would appear unexpectedly. Terragon is a distributed system, so it was one of those bugs that was annoying to diagnose and the issue wasn't immediately clear. Not expecting much, I gave Terry a description of the bug, and it identified the issue in one shot and fixed it. Most of the work was identifying the bug, which required reading through a lot of code—exactly what agents excel at.

- About half the time, user bug reports get a "first pass" immediately by Terry. Even when the implementation isn't what we'd merge or perfect, it usually moves things along significantly. For example, its thought process gives you more insight into the problem and the solution.

- I've been using terragon to prototype new features and ideas incrementally. Often for meaty features, I'll ask terry to prototype the task in increasing specificity, starting from a vague description of what I want to build. For each attempt, I read its output to learn more about the problem I'm trying to solve and the solution I'm trying to implement. Most of these tasks are never merged, but they're a great way to get a sense of how something might work or issues that might come up before I actually start building it.

## Learnings

Here are some things I've learned so far leaning into this workflow:

- **Get to know the model.** What is it good at? What is it not good at? This takes time and experimentation. The agent is simultaneously smart and dumb.

- **Learn to give up.** If an agent is going down the wrong path, it's better to abandon the task and try again with different instructions rather than keep saying "that's wrong" or trying to course-correct.

- **Managing multiple agents requires a lot of context switching.** This isn't normal! You're suddenly tracking 10+ concurrent work streams instead of 1-2. But you get to do a lot more things in a shorter amount of time.

- **You don't need to use the agent for every task.** Sometimes it's better to just do it yourself. This goes back to the idea of "get to know the model". You'll start to understand what the agent is good at and what it's not good at.

## What's next?

I'm really excited and intrigued by how background agents will evolve. It's honestly too early to tell how things will shake out but I'm sure we're going to see a lot more of them in the future.

Using terragon has fundamentally changed how I think about breaking down work. I'm creating smaller, more agent-friendly tasks. I'm more willing to explore ideas because the cost is so low. And I'm spending more time on the parts of development that actually require human judgment. I can't imagine going back to a purely local setup. The ability to parallelize work across multiple agents while keeping a focused local environment has been transformative.
