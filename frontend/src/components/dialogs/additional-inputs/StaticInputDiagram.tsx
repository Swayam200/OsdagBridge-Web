/** Fixed illustrations for layout review; never derived from the current inputs. */
import React from 'react';

type Diagram = 'typical' | 'girder-overview' | 'girder-section' | 'stiffener' | 'bracing' | 'angle';

const viewBoxes: Record<Diagram, string> = {
  typical: '0 0 1000 310',
  'girder-overview': '0 0 1000 165',
  'girder-section': '0 0 400 310',
  stiffener: '0 0 1000 220',
  bracing: '0 0 400 220',
  angle: '0 0 400 200',
};

const descriptions: Record<Diagram, string> = {
  typical: 'Bridge cross-section with sample dimensions',
  'girder-overview': 'Bridge cross-section with an exterior girder highlighted',
  'girder-section': 'Girder I-section with sample dimensions',
  stiffener: 'Girder web with sample bearing and intermediate stiffeners',
  bracing: 'X-bracing between two girders',
  angle: 'Double-angle section with sample dimensions',
};

// Exact schema IDs keep unrelated Desktop model widgets out of this read-only renderer.
export const staticDiagramFields: Record<string, Diagram> = {
  'member_properties.girder_details.cad_preview': 'girder-overview',
  'member_properties.girder_details.section_preview': 'girder-section',
  'member_properties.stiffener_details.stiffener_details_cad': 'stiffener',
  'member_properties.cross_bracing_details.layout_cad': 'bracing',
  'member_properties.cross_bracing_details.bracing_preview': 'angle',
  'member_properties.cross_bracing_details.top_chord_preview': 'angle',
  'member_properties.cross_bracing_details.bottom_chord_preview': 'angle',
  'member_properties.end_diaphragm_details.bracing_layout_cad': 'bracing',
  'member_properties.end_diaphragm_details.bracing_section_preview': 'angle',
  'member_properties.end_diaphragm_details.top_chord_preview': 'angle',
  'member_properties.end_diaphragm_details.bottom_chord_preview': 'angle',
};

export function StaticInputDiagram({ diagram, memberLabel }: { diagram: Diagram; memberLabel?: string }) {
  return <figure className={`additional-static-diagram additional-static-${diagram}`}>
    <div className="additional-static-canvas"><svg viewBox={viewBoxes[diagram]} role="img" aria-label={descriptions[diagram]}>
      <use href={`/vectors/additional-input-references.svg#${diagram}`} />
      {diagram === 'bracing' && <text x="200" y="195" textAnchor="middle" className="additional-static-member">
        {memberLabel}
      </text>}
    </svg></div>
    <figcaption>Illustrative example · fixed geometry</figcaption>
  </figure>;
}
