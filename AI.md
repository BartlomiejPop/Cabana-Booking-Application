# AI Workflow

This file documents how AI assistance was used while working on this repository, as requested in [GUIDELINES.md](GUIDELINES.md).

## Tooling Used

- GitHub Copilot in VS Code (Auto mode)
- Chat GPT for generic technology questions regarding project architecture

## Agent Setup And Usage Strategy

The AI setup was intentionally split into two roles:

1. Planning role (Chat GPT)
    - Used before implementation to validate architecture direction, API scope, and feature implementation.
    - Focused on decision support and trade-offs, not direct repository edits.

2. Implementation role (GitHub Copilot in VS Code)
    - Used during coding for feature implementation, refactoring, and test generation directly in the codebase.
    - Prompts were scoped to small tasks (single feature, route, component, or test file) to keep changes reviewable.

3. Human control and quality gate
    - Every generated change was reviewed manually before being kept.
    - Behavior was validated with tests and manual checks before moving to the next step.
    - Final decisions on scope, correctness, and code quality were always made manually and well understood.

## How AI Was Used

General way of working with AI:

1. prompt precisely details about feature I want to implement on current branch
2. Make manual test to check if the functionality works properly
3. Review and understand the generated code. Prompting questions regarding the new code if functionality is not understood
4. Split the generated code to separated components to build maintainable structure
5. Review the files and clean code if needed
6. Prompt tests generation for new files
7. Review the generated tests and add more if needed (often happens)
8. When feature is ready prompt AI to review the files again and ask if something can be improved.

This kept the changes local, testable, and easy to review.

## Examples of prompts used during the work:

1. Read the guidelines and explain what is best approach to create this project. Tackle the questions:
    -Is pure javascript better for this project or is it worth to use framework?
    -Is pure Node.js enough or better use Express or Nest?


2. Prepare backend in Express exposing routes:
    - `GET /api`
    - `GET /api/map`
    - `GET /api/bookings`
    - `GET /api/cabanas`
    - `POST /api/validate-guest`
    - `POST /api/cabanas/:cabanaId/bookings`
Is something more needed on backend in this assigment?

3. extract service functions to separate files in /services. Don't create one helpers.ts file

4. create one test file for every route instead of one big api.test.ts file like it is now

5. the backend seems to be ready. Is there something that should be improved?

6. as a frontend I think best way would be to display one container in the middle of a screen with generated map using pictures in assets and the map.ascii file. is that good idea?

7. for the whole road you used arrowStraight. Try to use:
arrowCornerSquare when road is a corner and leading up and right. If road leads different directions rotate the initial image.
arrowCrossing when crossing can lead up,left,down and right
arrowEnd when the road leads nowhere specific
arrowSplit if road can lead up,right and down. Rotate image to match different directions

Note that path next to chalet should lead to it too.

8. small fix for road and chalet behaviour
There should be only path leading to chalet and if possible it is from the bottom. If chalet is not over the road connect the road from different direction

9. if the booking was succesfull the message text should be green. if fails its red. when switching from one cabana to other inform also about it at message

10. generate 4more bookings and 9 more ASCII maps for testing purposes. Try to make them different. Target edge cases

## What AI Helped With

- Highly accelerate redundand work like styling or debugging
- Helping creating architecture and gathering tech stack for given project idea
- Asking if given Idea is a good way of working or should something be improved
- generating focused test cases for route, service, and component edge cases
- drafting documentation prototype from the actual repository scripts and structure
- verifying that new tests matched current behavior instead of inventing new requirements
- Finding optimal solution to solve problems
- Finding typos, edge cases and implementing better test coverage

## Validation Performed

Changes were validated with repository commands rather than accepted without execution. The main checks used were:

- manual tests

```bash
npm test
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run build
npm start
npm start --map ./testApi/maps/map2.ascii --bookings ./testApi/bookings/bookings2.json
```

-code review

## Cost of prompts during development

The full cost of prompts used during this project was around 400 Copilot credits

## Human Review And Trade-Offs

AI was used to accelerate implementation and documentation, but the workflow still relied on local verification after changes. The main trade-off is speed versus judgment: AI is effective at repetitive edits and test expansion, but the final code and documentation still need a human to decide whether the scope, tone, and behavior match the challenge.