# Agent Start Command

Load agent workspace context from $ARGUMENTS and begin working on assigned tasks.

Parse the agent_context.json to extract the agentRole and focusArea, then:

1. Load all workspace files (agent_context.json, files_to_work_on.txt, test_contracts.txt, validation_checklist.txt)
2. Understand your dynamic role from the agentRole field in the context
3. Begin working systematically through the validation checklist
4. Update the checklist by changing [ ] to [x] as you complete items
5. Create and modify files as specified in files_to_work_on.txt
6. Focus on the specific responsibilities defined in your agent context

Your role and priorities are determined dynamically from the agent context, not hard-coded.
