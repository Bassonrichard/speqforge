## Summary

I've been working with spec-driven development tools for a while and have given numerous talks about it. The main tool I use is Spec Kit. I started with Kiro and have used similar tools like Antigravity for planning. BMAD is a popular one gaining traction in our company, and there's also OpenSpec, which takes a different approach. 


--- 

## BYOK (Bring Your Own Key)

Requirement Tracer sparked my idea, but it's still in IDE and isn't BYOK, which is a limiting factor for me. However, it looks like a good reference point in other aspects. BYOK is important to me. OpenCode has a good approach to BYOK.

## Sources

- https://opencode.ai/
- https://tracer.ai/
- https://github.com/github/spec-kit
- https://kiro.dev/
- https://openspec.dev/
- https://docs.bmad-method.org/ 

--- 

## Problem Statement

The main problem is that all people working on a project then need to access the IDE and interact with the terminal, which is a big barrier to entry for those with all the business knowledge. I want to build a system that helps with that flow.

--- 

## Vision

I want to build, ideally, a web portal that handles spec-driven development from a spec/sign-off work planning perspective. It can then hand off to the developer for implementation. Everyone should be working in their own environments. 

Ideally, the business people can use their existing subscriptions to create specs, which then get linked to a repo. Business Analysts and Product Owners can write and review specs in their web interface, but everything gets synced to the repo so they have their own branch. They then hand over to developers who take on that branch and do the technical implementation further in the terminal, where they can use their chosen code tools. 

--- 

## Practical Details

The main support I want is for GitHub Copilot and GitHub for repos, but I also want it to work with Claude Code. One possibility is having a single plan and associating multiple repos with it, then creating the plan in each with the same branch naming. The branch naming should be configurable. 

The main issue this resolves is having 1 plan spanning multiple repos. You associate repos to a project, then make it easier for business people to associate specs to a project. 

--- 

## Spec Forge - User Flow

The flow would be: business opens a project, creates a new feature, and writes high-level specs for it. They should be able to add MCP servers—but it's not a hard requirement. It will then use set-out templates and instructions/agents to build these specs for the user. There should be config for these templates so they have a default but can add their own to customize it. 

Once they're happy, the agent should check edge cases and prompt them with clarifying questions using multi-select, radio button, or free text input. These clarifying questions should inform and refine the spec. 

Once they're happy with the spec, they should be able to hand over to developers so they have the spec in their repos and can just pick it up from the spec and start the technical planning or building. Once the feature is merged in, it should show in the portal as complete so that it can get handed off to testers or have a feature review scheduled, so the team can look over the feature.