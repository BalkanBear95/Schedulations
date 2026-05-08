# Schedulations Project Context

## Project purpose

This repository contains a React + Vite scheduling application for managing appointments.

The main domain entity is an appointment. The app lets a user:

- choose a year, month, and day
- choose a procedure
- view valid start slots for that procedure
- create bookings
- view daily bookings
- cancel bookings
- reschedule bookings
- create recurring appointments
- handle recurring conflicts
- move future replacement candidates into newly freed slots

Supabase is the current backend. The frontend reads and updates appointment rows directly through the Supabase JavaScript client.

## Stack

Current stack from `package.json` and the repo:

- React
- React DOM
- Vite
- JavaScript
- Supabase via `@supabase/supabase-js`
- CSS modules are not used; styling is plain CSS files imported per component

Current dev tooling:

- ESLint
- `@vitejs/plugin-react`

This app currently does **not** use:

- React Router
- Redux
- Zustand
- Tailwind
- a UI component library

## File structure

Top-level files and folders relevant to the app:

- `src/App.jsx`: main application state and business logic
- `src/main.jsx`: React entry point
- `src/lib/supabase.js`: Supabase client creation
- `src/components/BookingForm.jsx`: create-booking form
- `src/components/BookingList.jsx`: right-side booking list and replacement suggestions
- `src/components/DayList.jsx`: year/month/day selection UI
- `src/components/ProcedureSelector.jsx`: procedure selection UI
- `src/components/SlotList.jsx`: scheduler grid, slot selection, reschedule UI, and manual conflict placement UI
- `src/*.css` and `src/components/*.css`: component styling

Other repo notes:

- `dist/` exists in the repository, so built output is currently present
- `.env` exists locally, but secrets and environment values are intentionally not documented here

## Main components

### `src/App.jsx`

This is the central container for the app and currently holds most of the business logic.

It is responsible for:

- top-level state for date, procedure, slot selection, bookings, recurrence flows, replacement opportunities, and save flags
- generating the scheduler slots
- loading scheduled appointments from Supabase on startup
- mapping Supabase appointment rows into frontend booking objects
- determining whether a booking can fit in a slot
- saving new appointments to Supabase
- saving recurring appointments to Supabase
- canceling bookings by updating appointment `status`
- rescheduling bookings by updating date/time fields
- editing future recurrence behavior
- handling manual recurring conflict resolution
- suggesting and moving replacement candidates into freed slots

`App.jsx` also computes most props passed into the child components.

### `src/main.jsx`

Application entry point.

It:

- imports global `index.css`
- renders `<App />` inside `React.StrictMode`
- mounts the app into the `#root` element

### `src/lib/supabase.js`

Creates and exports the shared Supabase client.

It reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

from Vite environment variables via `import.meta.env`.

### `src/components/BookingForm.jsx`

Form for creating a new booking.

It manages local input state for:

- patient name
- patient surname
- phone
- reason
- anticipation availability
- poorness allergy
- gender
- notes
- recurring toggle
- recurrence interval unit
- recurrence interval value
- recurrence repeat count

It submits a plain object through `onSave(formData)`. It does not talk to Supabase directly.

### `src/components/BookingList.jsx`

Displays bookings for the currently selected day.

It is responsible for:

- showing each booking summary and details
- triggering cancel
- triggering reschedule mode
- opening recurrence editing UI
- opening stop-recurrence confirmation UI
- displaying replacement suggestions for a freed slot
- triggering move of a replacement candidate into the freed slot

Important props include:

- `bookings`
- `onCancelBooking`
- `onStartReschedule`
- `onMoveCandidateToFreedSlot`
- recurrence editing callbacks
- `replacementSuggestionData`

### `src/components/DayList.jsx`

Date selection UI for:

- year
- month
- day

It is a presentational component that delegates selection back to `App.jsx` through callback props.

### `src/components/ProcedureSelector.jsx`

Procedure selection UI.

It receives the available procedures and notifies `App.jsx` when the selected procedure changes.

Each procedure currently includes:

- `name`
- `slots`
- `colorClass`

### `src/components/SlotList.jsx`

Visual scheduler grid for the selected day.

It is responsible for:

- displaying occupied and available slots
- showing booking preview blocks for the selected procedure
- handling slot selection
- opening a small booking detail overlay when an occupied slot is clicked
- showing reschedule controls
- showing manual recurring conflict resolution controls
- visually marking overlaps and highlighted conflict slots

It does not read or write Supabase directly. It relies on props from `App.jsx`.

## Data model

## Main backend table used by the frontend

The frontend currently reads from and writes to the Supabase `appointments` table.

Visible frontend usage shows these fields:

- `id`: appointment identifier used for update targeting
- `patient_name`: patient first name
- `patient_surname`: patient surname
- `phone`: patient phone number
- `gender`: gender value used by the UI
- `reason`: reason string stored with the appointment
- `anticipation_available`: whether the patient can be anticipated into an earlier slot
- `poorness_allergy`: boolean flag used by the UI
- `notes`: optional text notes
- `procedure_name`: selected procedure name
- `procedure_slots`: number of 5-minute slots used by the procedure
- `appointment_date`: appointment date
- `start_time`: appointment start time
- `end_time`: appointment end time
- `start_slot_index`: index of the start slot in the generated day slot list
- `status`: frontend currently uses at least `scheduled` and `cancelled`
- `is_recurring`: whether the appointment is part of a recurring series
- `recurrence_series_id`: shared id for appointments in the same recurring series
- `recurrence_interval_value`: repeat interval number
- `recurrence_interval_unit`: repeat interval unit such as `weeks` or `months`
- `recurrence_index`: frontend-tracked order/index within a recurrence series
- `created_at`: timestamp selected by the frontend when reading rows
- `updated_at`: timestamp selected by the frontend when reading rows and updated in some write flows

Important note:

- This document only describes fields visible in frontend usage.
- Database constraints, indexes, triggers, and policies are **not** documented in this repository.

## Frontend booking object shape

`App.jsx` maps Supabase rows into an in-memory booking object used across the UI. Common fields include:

- `id`
- `name`
- `surname`
- `phone`
- `gender`
- `reason`
- `anticipation`
- `poornessAllergy`
- `notes`
- `procedure`
- `slotsUsed`
- `slot`
- `startMinutes`
- `endMinutes`
- `startSlotIndex`
- `status`
- `isRecurring`
- `recurrenceSeriesId`
- `recurrenceIntervalValue`
- `recurrenceIntervalUnit`
- `recurrenceIndex`
- `year`
- `month`
- `day`

Bookings are stored in a map keyed by a generated booking key:

- `${year}-${month}-${day}-${slot}`

## Main user flows

### Selecting a day

The user selects year, month, and day in `DayList.jsx`. `App.jsx` updates the selected date state and derives the bookings for that day from the in-memory booking map.

### Selecting a procedure

The user selects a procedure in `ProcedureSelector.jsx`. `App.jsx` uses the procedure’s slot count to determine which start slots are valid.

### Selecting an available slot

`SlotList.jsx` receives the full slot list, the day’s bookings, and the valid `availableSlots`. When the user clicks a free valid slot, it calls `onSelectSlot` and `App.jsx` stores the selected slot.

### Creating a booking

`BookingForm.jsx` submits form data to `App.jsx` through `onSave`.

`App.jsx`:

- validates the selected slot and procedure
- computes `appointment_date`, `start_time`, `end_time`, and `start_slot_index`
- inserts a row into Supabase
- maps the saved row back into the local booking structure
- updates local state only after the save flow succeeds

### Displaying existing bookings

On startup, `App.jsx` loads `scheduled` appointments from Supabase, orders them by date and time, maps them into local booking objects, and stores them in the `bookings` state map.

`BookingList.jsx` shows bookings for the selected day.

`SlotList.jsx` also visualizes those bookings on the daily scheduler grid.

### Deleting/canceling bookings

Canceling a booking currently means updating the appointment row in Supabase so `status` becomes `cancelled`.

After a successful update, `App.jsx` removes the booking from local state and creates a `replacementOpportunity` for the freed slot.

### Rescheduling bookings

When the user starts reschedule mode from `BookingList.jsx`, `App.jsx` stores the booking being rescheduled and `SlotList.jsx` shows reschedule actions.

On confirmation, `App.jsx` updates the same Supabase row with the new:

- `appointment_date`
- `start_time`
- `end_time`
- `start_slot_index`

Then it updates local booking state. If the original slot becomes free, the app opens a replacement opportunity for that freed slot.

### Creating recurring appointments

The booking form can mark an appointment as recurring and provide interval settings.

`App.jsx` generates recurrence occurrences in the frontend, classifies conflicts, inserts allowed occurrences into Supabase, and stores a recurrence summary for the UI.

Recurring appointments use:

- `is_recurring`
- `recurrence_series_id`
- `recurrence_interval_value`
- `recurrence_interval_unit`
- `recurrence_index`

### Handling recurring appointment conflicts

Conflict logic is mostly implemented in `App.jsx`.

Current behavior includes:

- automatic insertion when overlap is allowed
- warning candidates that can be confirmed or dismissed
- hard conflicts that can be resolved manually
- manual conflict placement using the scheduler in `SlotList.jsx`

The recurrence summary UI is also driven by `App.jsx`.

### Moving replacement candidates into freed slots

After a cancellation or a reschedule that frees the original slot, `App.jsx` can create a `replacementOpportunity`.

It then:

- searches future candidate bookings with `anticipation` enabled
- filters candidates that fit the freed slot
- shows them in `BookingList.jsx`
- updates the selected candidate appointment row in Supabase when moved
- updates local state after the Supabase update succeeds
- closes the replacement opportunity after a successful move

## Important business rules

- The workday is generated in 5-minute slots.
- Procedures define their own duration through `slots`.
- A booking occupies consecutive slots starting from `start_slot_index`.
- Lunch break exists in the schedule configuration and is visually separated in the scheduler.
- Working days are configured in `App.jsx`.
- Weekend recurrence handling is frontend-driven through schedule rules in `App.jsx`.
- Availability checks are mostly computed in the frontend from the current `bookings` map.
- The app currently loads only appointments with `status = scheduled`.
- Cancel actions currently change status instead of deleting rows.
- Replacement candidates come from future appointments where `anticipation` is enabled.

## Known risks

- `App.jsx` is large and contains too much business logic.
- Scheduling rules are mostly frontend-driven.
- Supabase schema and constraints are not documented in the repo.
- Conflict detection may be hard to maintain if more scheduling rules are added.
- Recurrence logic should be changed carefully.
- Replacement candidate logic should be tested after any change.

Additional practical risks visible from the current code:

- Many flows depend on keeping the frontend booking object shape consistent.
- Several independent UI modes are coordinated from `App.jsx`, including reschedule mode, recurrence editing, manual conflict resolution, and replacement opportunities.
- Time and overlap calculations are repeated in frontend helpers, so small changes can have side effects across multiple flows.

## Development rules for future changes

- Keep changes small and targeted.
- List files allowed to change before modifying code.
- Avoid broad `App.jsx` refactors unless explicitly requested.
- Run `npm run build` after changes.
- Preserve the existing booking object shape unless intentionally changing the data model.
- Do not change recurrence logic while fixing unrelated UI issues.
- Do not add new dependencies without justification.
- Prefer documenting assumptions when backend behavior is inferred from frontend usage.
- When touching replacement or recurrence behavior, verify both the Supabase write path and the local state update path.

## Suggested prompt starter for future work

When asking Codex to change this project, it will usually help to include:

- the exact goal
- the files allowed to change
- files that must not change
- whether Supabase behavior must stay unchanged
- whether local UI behavior must stay unchanged
- whether the booking object shape must stay unchanged

This project is easiest to work on when changes are constrained to a narrow slice of the current logic.
