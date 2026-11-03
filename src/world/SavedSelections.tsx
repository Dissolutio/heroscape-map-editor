import { IconButton, Tooltip } from '@mui/material'
import { MdDeleteOutline, MdEdit } from 'react-icons/md'
import SelectionRecallButton from '../controls/SelectionRecallButton'
import useBoundStore from '../store/store'

export default function SavedSelections() {
  const savedSelections = useBoundStore((state) => state.savedSelections)
  const renameSavedSelection = useBoundStore(
    (state) => state.renameSavedSelection,
  )
  const deleteSavedSelection = useBoundStore(
    (state) => state.deleteSavedSelection,
  )

  if (!savedSelections.length) return null

  return (
    <section aria-label="Saved selections" className="action-log__saved">
      <span className="action-log__saved-label">Saved selections</span>
      {savedSelections.map((selection) => (
        <div className="action-log__saved-chip" key={selection.id}>
          <SelectionRecallButton
            className="action-log__saved-recall"
            label={`Recall saved selection ${selection.name}`}
            selection={selection}
          >
            {selection.name}
          </SelectionRecallButton>
          <Tooltip title={`Rename ${selection.name}`}>
            <IconButton
              aria-label={`Rename saved selection ${selection.name}`}
              className="action-log__saved-action"
              onClick={() => {
                const name = window.prompt('Rename selection', selection.name)
                if (name !== null) renameSavedSelection(selection.id, name)
              }}
              size="small"
            >
              <MdEdit size={12} />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${selection.name}`}>
            <IconButton
              aria-label={`Delete saved selection ${selection.name}`}
              className="action-log__saved-action"
              onClick={() => deleteSavedSelection(selection.id)}
              size="small"
            >
              <MdDeleteOutline size={14} />
            </IconButton>
          </Tooltip>
        </div>
      ))}
    </section>
  )
}
