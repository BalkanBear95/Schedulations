import { useState } from "react";
import "./BookingForm.css";

function BookingForm({ onSave }) {
  const reasonOptions = ["Urgent", "Ma doare, dar nu prea", "N-am ce face acasa"];
  const genderOptions = ["male", "female", "Other"];
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("reason1");
  const [anticipation, setAnticipation] = useState(false);
  const [poornessAllergy, setPoornessAllergy] = useState(false);
  const [gender, setGender] = useState("male");
  const [notes, setNotes] = useState("");

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
          />
        </div>
      </div>

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
        />
      </div>

      <label className="booking-form-checkbox-label">
        <input
          type="checkbox"
          checked={anticipation}
          onChange={(event) => setAnticipation(event.target.checked)}
        />
        {" "}availability for anticipation
      </label>

      <label className="booking-form-checkbox-label">
        <input
          type="checkbox"
          checked={poornessAllergy}
          onChange={(event) => setPoornessAllergy(event.target.checked)}
        />
        {" "}allergy to poorness
      </label>

      <button type="submit" className="booking-form-save-button">Save</button>
    </form>
  );
}

export default BookingForm;
