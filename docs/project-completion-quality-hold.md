# Project completion quality-and-handover rule

## Enforced interpretation

- **Scheduled completion date:** the latest milestone `target_date` (falling back to the project `end_date` only when no milestone target exists).
- **Deliverables finished:** every milestone has completion evidence accepted by an administrator, `completion_status=approved`, `status=completed`, and an actual completion date.
- **Project finished:** deliverables are finished, funding is at least 100%, all secured funds have been released, the mandatory hold has elapsed, and an administrator explicitly approves handover. Only then does the project become `completed`.
- **Timing coverage:** early, on-schedule, and late final acceptance all receive the same strict hold. This deliberately includes the exact scheduled date so it cannot bypass the rule.

## Three-day rule

Final milestone acceptance starts a 72-hour (`3 × 24 hours`) quality-and-handover hold. The hold ends exactly at `quality_hold_until`; it is not merely three date labels. During the hold:

- the project remains in `implementation`;
- confirmed investments remain confirmed;
- the budget, funding goal, secured/released/refunded balances, and milestone allocations do not change;
- no additional withdrawal is created;
- stakeholders can perform quality checks, resolve defects, prepare documentation, and complete handover;
- project closure is rejected, even for an administrator.

After the deadline, an administrator must submit handover notes through `POST /api/v1/admin/projects/{id}/finalize-completion/`. That approval closes the project and completes its confirmed investments.

## Trigger, approval, and notifications

1. Entrepreneur submits evidence and a completion summary for the final milestone.
2. Administrator reviews and accepts the final milestone deliverables.
3. The server checks all milestones, 100% funding, and zero available secured balance.
4. The server records the hold start/deadline and an audit event, without changing the budget.
5. Entrepreneur, funded investors, and active administrators receive a hold-start notification with the deadline.
6. Attempts to close early return the exact deadline.
7. After 72 hours, an administrator approves handover with notes.
8. The server closes the project, completes confirmed investments, writes audit records, and notifies the entrepreneur and investors.

## Decision checklist

```text
all milestone evidence accepted?      no -> do not start hold
funded_amount >= goal_amount?          no -> do not start hold
secured available balance == 0?       no -> do not start hold
                                      yes to all -> start 72-hour hold once
current time < quality_hold_until?     yes -> reject project closure
administrator handover notes valid?   no -> reject project closure
                                      yes -> close project and notify stakeholders
```
