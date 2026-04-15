import "./ProcedureSelector.css";

function ProcedureSelector({
  procedures,
  selectedProcedure,
  onSelectProcedure,
}) {
  return (
    <div className="procedure-selector-container">
      <h3 className="procedure-selector-heading">Select procedure</h3>

      <div className="procedure-selector-options">
        {procedures.map((procedure) => (
          <button
            key={procedure.name}
            onClick={() => onSelectProcedure(procedure.name)}
            className={`procedure-selector-option-button ${
              selectedProcedure === procedure.name
                ? "procedure-selector-option-button-selected"
                : ""
            }`}
          >
            <div className="procedure-selector-option-name">{procedure.name}</div>
            <div className="procedure-selector-option-details">
              {procedure.slots} slots ({procedure.slots * 5} min)
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProcedureSelector;
