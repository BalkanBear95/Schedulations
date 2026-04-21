import { useState } from "react";
import "./BookingForm.css";

function BookingForm({ onSave, isSaving }) {
  const reasonOptions = ["Urgent", "Ma doare, dar nu prea", "N-am ce face acasa"];
  const genderOptions = ["male", "female", "Other"];
  const recurrenceToggleOptions = [
    { label: "No", value: false },
    { label: "Yes", value: true },
  ];
  const recurrenceUnitOptions = [
    { label: "Weeks", value: "weeks" },
    { label: "Months", value: "months" },
  ];
  const repeatCountOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("reason1");
  const [anticipation, setAnticipation] = useState(false);
  const [poornessAllergy, setPoornessAllergy] = useState(false);
  const [gender, setGender] = useState("male");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceIntervalUnit, setRecurrenceIntervalUnit] = useState("weeks");
  const [recurrenceIntervalValue, setRecurrenceIntervalValue] = useState(1);
  const [recurrenceRepeatCount, setRecurrenceRepeatCount] = useState(1);

  const intervalValueOptions =
    recurrenceIntervalUnit === "months"
      ? Array.from({ length: 12 }, (_, index) => index + 1)
      : Array.from({ length: 6 }, (_, index) => index + 1);

  const handleSelectRecurrence = (nextValue) => {
    setIsRecurring(nextValue);
  };

  const handleSelectRecurrenceUnit = (unit) => {
    setRecurrenceIntervalUnit(unit);
    setRecurrenceIntervalValue(1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      name,
      surname,
      phone,
      reason,
      anticipation,
      poornessAllergy,
      gender,
      notes,
      recurrence: {
        enabled: isRecurring,
        intervalUnit: recurrenceIntervalUnit,
        intervalValue: recurrenceIntervalValue,
        repeatCount: recurrenceRepeatCount,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form-container">
      <div className="booking-form-name-row">
        <div className="booking-form-field-group">
          <label htmlFor="booking-form-name" className="booking-form-field-label">
            Name
          </label>
          <input
            id="booking-form-name"
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="booking-form-text-input"
            disabled={isSaving}
          />
        </div>

        <div className="booking-form-field-group">
          <label htmlFor="booking-form-surname" className="booking-form-field-label">
            Surname
          </label>
          <input
            id="booking-form-surname"
            type="text"
            placeholder="Enter surname"
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
            className="booking-form-text-input"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="booking-form-field-group">
        <span className="booking-form-field-label">Recurring appointment</span>
        <div className="booking-form-option-grid">
          {recurrenceToggleOptions.map((toggleOption) => (
            <button
              key={toggleOption.label}
              type="button"
              onClick={() => handleSelectRecurrence(toggleOption.value)}
              className={`booking-form-option-button ${
                isRecurring === toggleOption.value
                  ? "booking-form-option-button-selected"
                  : ""
              }`}
              aria-pressed={isRecurring === toggleOption.value}
              disabled={isSaving}
            >
              {toggleOption.label}
            </button>
          ))}
        </div>
      </div>

      {isRecurring && (
        <div className="booking-form-recurrence-panel">
          <div className="booking-form-field-group">
            <span className="booking-form-field-label">Interval unit</span>
            <div className="booking-form-option-grid">
              {recurrenceUnitOptions.map((unitOption) => (
                <button
                  key={unitOption.value}
                  type="button"
                  onClick={() => handleSelectRecurrenceUnit(unitOption.value)}
                  className={`booking-form-option-button ${
                    recurrenceIntervalUnit === unitOption.value
                      ? "booking-form-option-button-selected"
                      : ""
                  }`}
                  aria-pressed={recurrenceIntervalUnit === unitOption.value}
                  disabled={isSaving}
                >
                  {unitOption.label}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-form-field-group">
            <span className="booking-form-field-label">
              Every how many {recurrenceIntervalUnit}
            </span>
            <div className="booking-form-chip-grid">
              {intervalValueOptions.map((intervalValue) => (
                <button
                  key={intervalValue}
                  type="button"
                  onClick={() => setRecurrenceIntervalValue(intervalValue)}
                  className={`booking-form-chip-button ${
                    recurrenceIntervalValue === intervalValue
                      ? "booking-form-chip-button-selected"
                      : ""
                  }`}
                  aria-pressed={recurrenceIntervalValue === intervalValue}
                  disabled={isSaving}
                >
                  {intervalValue}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-form-field-group">
            <span className="booking-form-field-label">
              Future appointments to generate
            </span>
            <div className="booking-form-chip-grid">
              {repeatCountOptions.map((repeatValue) => (
                <button
                  key={repeatValue}
                  type="button"
                  onClick={() => setRecurrenceRepeatCount(repeatValue)}
                  className={`booking-form-chip-button ${
                    recurrenceRepeatCount === repeatValue
                      ? "booking-form-chip-button-selected"
                      : ""
                  }`}
                  aria-pressed={recurrenceRepeatCount === repeatValue}
                  disabled={isSaving}
                >
                  {repeatValue}
                </button>
              ))}
            </div>
            <p className="booking-form-helper-text">
              This adds the selected appointment plus {recurrenceRepeatCount} future
              appointments.
            </p>
          </div>
        </div>
      )}

      <div className="booking-form-field-group">
        <label htmlFor="booking-form-phone" className="booking-form-field-label">
          Phone number
        </label>
        <input
          id="booking-form-phone"
          type="tel"
          placeholder="Enter phone number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="booking-form-text-input"
          disabled={isSaving}
        />
      </div>

      <div className="booking-form-field-group">
        <span className="booking-form-field-label">Reason</span>
        <div className="booking-form-option-grid">
          {reasonOptions.map((reasonOption) => (
            <button
              key={reasonOption}
              type="button"
              onClick={() => setReason(reasonOption)}
              className={`booking-form-option-button ${
                reason === reasonOption ? "booking-form-option-button-selected" : ""
              }`}
              disabled={isSaving}
            >
              {reasonOption}
            </button>
          ))}
        </div>
      </div>

      <div className="booking-form-field-group">
        <span className="booking-form-field-label">Gender</span>
        <div className="booking-form-option-grid">
          {genderOptions.map((genderOption) => (
            <button
              key={genderOption}
              type="button"
              onClick={() => setGender(genderOption)}
              className={`booking-form-option-button ${
                gender === genderOption ? "booking-form-option-button-selected" : ""
              }`}
              disabled={isSaving}
            >
              {genderOption}
            </button>
          ))}
        </div>
      </div>

      <div className="booking-form-field-group">
        <label
          htmlFor="booking-form-notes"
          className="booking-form-field-label"
        >
          Add notes
        </label>
        <textarea
          id="booking-form-notes"
          placeholder="Optional notes for this appointment"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="booking-form-notes-input"
          rows={4}
          disabled={isSaving}
        />
      </div>

      <label className="booking-form-checkbox-label">
        <input
          type="checkbox"
          checked={anticipation}
          onChange={(event) => setAnticipation(event.target.checked)}
          disabled={isSaving}
        />
        {" "}availability for anticipation
      </label>

      <label className="booking-form-checkbox-label">
        <input
          type="checkbox"
          checked={poornessAllergy}
          onChange={(event) => setPoornessAllergy(event.target.checked)}
          disabled={isSaving}
        />
        {" "}allergy to poorness
      </label>

      <button
        type="submit"
        className="booking-form-save-button"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export default BookingForm;
