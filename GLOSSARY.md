# Zenner Core

Zenner is a daily planning and reflection service centered on living one day at a time, where each day is an intentional container for timeblocks, tasks, and reflections.

## Language

**Day**:
The primary planning aggregate representing a single calendar date for a user, containing that day's timeblocks, tasks, and reminder responses.
_Avoid_: Date, entry, journal, calendar event

**Timeblock**:
A scheduled time interval (start time to end time) within a Day allocated for focused activity.
_Avoid_: Calendar slot, schedule event

**Timeblock Item**:
A granular detail or checklist element contained inside a Timeblock, loaded on demand when viewing that timeblock.
_Avoid_: Sub-task, item, child task

**Task**:
An action item assigned to a Day and categorized into the Eisenhower matrix (Do, Schedule, Delegate, or Delete).
_Avoid_: Todo, work item, ticket

**Reminder**:
A persistent habit prompt or reflection question configured by a user to check in against each day.
_Avoid_: Alert, system notification

**Reminder Response**:
A user's daily recorded answer (completion status and optional note) to a Reminder for a specific Day.
_Avoid_: Check-in record, habit log
