Coffee map marker assets live here.

Current file:

- `selected-pin.png`

Recommended export spec:

- format: `PNG`
- design size: `96 x 96 px`
- display size: `48 x 48 px`
- retina strategy: export at `2x`, render at half size

Notes:

- Keep the pin tip centered horizontally for easy map anchoring.
- Use transparent background.
- Reserve some outer padding for shadows so the marker does not clip.
- Current app implementation assumes the selected spot marker only. Unselected spots still use the default circle layer.
