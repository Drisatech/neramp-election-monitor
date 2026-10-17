import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Layers,
  ExternalLink,
  Cpu,
  UserCheck,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Methodology & Data Integrity Standards
        </h1>
        <p className="text-xs text-slate-500">
          Independent election observation principles, OCR workflow architecture, data classification, and verification standards.
        </p>
      </div>

      <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
        {/* Core Distinction */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span>1. Essential Electoral Data Distinctions</span>
          </h2>
          <p>
            To uphold the highest standards of civic integrity and precision, <strong>Nigeria Election Watch</strong> strictly distinguishes between five separate layers of electoral information:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Source Availability (Upload Progress):</strong> The percentage of polling units for which official result sheets (Form EC8A) have been published on the official election results portal. <em>Upload progress is never treated as a proxy for the percentage of votes counted or final outcome.</em>
            </li>
            <li>
              <strong>OCR Extractions:</strong> Machine-extracted text and numbers generated from scanned documents. OCR results are treated as preliminary raw data and are never published as final figures without verification.
            </li>
            <li>
              <strong>Transcribed Figures:</strong> Numbers keyed in or corrected from the visual source document by human operators.
            </li>
            <li>
              <strong>Verified Results:</strong> Transcriptions that have passed deterministic arithmetic checks (such as <code>Valid Votes + Rejected Ballots = Total Votes Cast</code>) and have been signed off by accredited verifiers.
            </li>
            <li>
              <strong>Officially Declared Results:</strong> The formal, legally binding declarations made exclusively by designated INEC Collation and Returning Officers in accordance with the Electoral Act.
            </li>
          </ul>
        </section>

        {/* Legal Status & Disclaimer */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>2. Independence & Official Source Attribution</span>
          </h2>
          <p>
            Nigeria Election Watch is an independent civic-technology initiative. It is not an official portal of the Independent National Electoral Commission (INEC).
          </p>
          <p>
            Official reference portal:
            <a
              href="https://inecelectionresults.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-emerald-800 font-bold underline inline-flex items-center gap-0.5"
            >
              https://inecelectionresults.ng
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <p>
            Every record retrieved preserves its source URL, retrieval timestamp, and a cryptographic SHA-256 checksum to guarantee document provenance and allow independent audits. The platform never alters original source documents.
          </p>
        </section>

        {/* OCR Architecture & Workflow */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-800" />
            <span>3. Result-Sheet OCR Processing Pipeline</span>
          </h2>
          <p>
            The Form EC8A Optical Character Recognition (OCR) pipeline ingests official polling unit result-sheet scans and generates structured machine readings through seven sequential phases:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Document Ingestion & Cryptographic Checksum:</strong> Result-sheet files (PDF, JPEG, PNG) are retrieved via the authorised source adapter. A SHA-256 hash is computed immediately to establish immutable document provenance.
            </li>
            <li>
              <strong>File Integrity & Boundary Validation:</strong> Enforces binary magic-header verification (rejecting non-image payloads) and file-size constraints (minimum 100 bytes to prevent blank uploads, maximum 10 MB).
            </li>
            <li>
              <strong>Image Preprocessing:</strong> Normalizes orientation tags (auto-rotating upside-down or sideways mobile captures), applies adaptive contrast enhancement and thresholding for carbon copies, and segments document regions of interest (metadata header, ballot statistics table, candidate tallies, official stamps).
            </li>
            <li>
              <strong>Candidate Tallies & Ballot Statistics Extraction:</strong> Extracts party votes (APC, PDP, LP, NNPP, APGA, SDP, ADC, etc.) alongside complete ballot statistics: Registered Voters, Accredited Voters, Ballots Issued, Unused Ballots, Spoiled Ballots, Rejected Ballots, Valid Votes, and Total Votes Cast.
            </li>
            <li>
              <strong>Polling Unit & Election Association:</strong> Parses the printed PU code on the sheet and cross-checks it against the geographic registry to detect misfiled or misallocated sheets.
            </li>
            <li>
              <strong>Multi-Layer Confidence Scoring:</strong> Evaluates digit certainty, contrast sharpness, and structural alignment. Assigns confidence scores per field and generates an aggregate sheet confidence metric (0–100%).
            </li>
            <li>
              <strong>Deterministic Arithmetic Consistency Gate:</strong> Automatically executes formula checks (<code>Valid Votes + Rejected Ballots == Total Votes Cast</code>, <code>Total Cast &le; Accredited Voters</code>, <code>Accredited &le; Registered</code>). Any arithmetic mismatch, smudged character, or confidence below 85% routes the sheet directly to human verification.
            </li>
          </ol>
        </section>

        {/* Human-in-the-Loop & Separate Data Storage */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-800" />
            <span>4. Human-in-the-Loop Verification Mandate & Separate Data Stores</span>
          </h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
            <strong>CRITICAL INTEGRITY PRINCIPLE:</strong> The platform <em>never automatically marks OCR output as verified</em>. Machine extractions are strictly treated as draft assistance. Only accredited human verifiers can certify a result.
          </div>
          <p>
            To prevent accidental data corruption and guarantee auditability, the system maintains strict separation across four distinct layers of data:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Original Source Document Reference:</strong> Preserves original URL, binary file hash, byte size, and portal retrieval timestamp. Source documents are immutable and never modified.
            </li>
            <li>
              <strong>Raw OCR Extraction Output:</strong> Retains initial machine-extracted text, field confidence scores, detected PU codes, and preprocessing diagnostics. Untouched by subsequent edits.
            </li>
            <li>
              <strong>Manually Corrected Transcription:</strong> Records operator adjustments made during visual inspection, accompanied by mandatory correction rationale and incremental version numbers.
            </li>
            <li>
              <strong>Verified Transcription Record:</strong> Retains formal reviewer sign-off, verifier identity, assigned role, verification decision (VERIFIED or DISCREPANCY_FLAGGED), and timestamped reviewer notes.
            </li>
          </ul>
          <p>
            All transcription edits generate an immutable entry in the version history, while reviewer interactions are captured in tamper-evident audit logs. Restricted evidence and confidential documents are accessible solely to authorised personnel with verified credentials.
          </p>
        </section>

        {/* OCR Technical & Physical Limitations */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>5. Technical & Physical Limitations of Result-Sheet OCR</span>
          </h2>
          <p>
            While computer vision significantly accelerates data extraction, automated recognition of field-completed election forms faces substantial real-world challenges:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <span className="font-bold text-slate-900 block">Handwriting Ambiguities</span>
              <p className="text-[11px] text-slate-600">
                Form EC8A entries are handwritten in the field by Presiding Officers. Digits such as <code>1</code> and <code>7</code>, <code>0</code> and <code>6/8</code>, or <code>3</code> and <code>5</code> frequently exhibit visual overlap, requiring human discernment.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <span className="font-bold text-slate-900 block">Carbon Copy Smudging</span>
              <p className="text-[11px] text-slate-600">
                Multiple copies of Form EC8A are produced using carbon sheets. Lower copies suffer from ghosting, low pigment transfer, smudged ink lines, or degraded digit boundaries.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <span className="font-bold text-slate-900 block">Mobile Capture Conditions</span>
              <p className="text-[11px] text-slate-600">
                Photographs captured on mobile devices at polling units often exhibit perspective distortion, shadow falloff, flash reflection, low lighting, or slight blur due to hand movement.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <span className="font-bold text-slate-900 block">Stamps & Signature Overlaps</span>
              <p className="text-[11px] text-slate-600">
                Official INEC presiding officer rubber stamps, party agent signatures, or cancellation marks frequently overlap numerical score cells, obstructing optical recognition.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 pt-1">
            Because of these physical realities, Nigeria Election Watch couples OCR with an interactive side-by-side verification interface where trained human analysts visually inspect original sheets against machine readings before any data reaches verified status.
          </p>
        </section>

        {/* Discrepancy Detection Principles */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-800" />
            <span>6. Objective Discrepancy Reporting</span>
          </h2>
          <p>
            A statistical irregularity, arithmetic mismatch on a paper sheet, or delayed upload is never automatically labeled as fraud or intentional misconduct. The platform provides verifiable evidence trails so election observers, civil society, and legal teams can examine primary source forms.
          </p>
        </section>

        {/* Section 7: Explainable Statistical Anomaly Detection */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-800" />
            <span>7. Explainable Statistical Anomaly Detection & Investigative Leads</span>
          </h2>
          <p>
            Statistical anomaly detection in Nigeria Election Watch applies transparent, explainable quantitative algorithms to identify unusual voting distributions across geographical peer groups:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              <strong>Turnout Outliers:</strong> Flags polling units where turnout rates exceed 95% of registered voters or surpass total accredited voter tallies.
            </li>
            <li>
              <strong>Rejected-Ballot Outliers:</strong> Evaluates rejected-ballot rates against regional peer means. Polling units exceeding 3 standard deviations (&gt;3σ) above the regional mean are flagged to identify potential ballot confusion, ink smudging, or inconsistent rejection criteria.
            </li>
            <li>
              <strong>Extreme Margin Skew:</strong> Detects polling units where a single candidate receives &gt;98% of valid votes cast in high-volume units.
            </li>
            <li>
              <strong>Identical Vote Sequences:</strong> Identifies duplicate candidate vote tally sequences across neighboring polling units in the same ward or LGA to prevent duplicate collation entries.
            </li>
          </ul>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium">
            <strong>Investigative Lead Doctrine:</strong> Statistical anomalies are investigative leads for observers and election monitors, not proof of fraud or official misconduct. The platform never automatically accuses candidates, parties, or electoral officials.
          </div>
        </section>

        {/* Section 8: Result Completeness Baseline & Source Checksums */}
        <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>8. Result Completeness Baseline & Source Checksum Integrity</span>
          </h2>
          <p>
            To prevent misleading statistical extrapolations, Nigeria Election Watch follows strict baseline protocols:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              <strong>No Zero-Filling of Missing Units:</strong> Missing or delayed result sheets are never treated as zero votes. Polling units are tracked in their exact lifecycle stage (Not Uploaded, Awaiting OCR, Under Verification, Discrepancy Flagged, Verified, or Published).
            </li>
            <li>
              <strong>Reliable Expected Baseline:</strong> Completeness percentages are computed only when the total expected polling unit count is established from verified INEC boundary gazettes.
            </li>
            <li>
              <strong>SHA-256 Checksum Verification:</strong> Genuine document modifications on official collation portals are tracked using cryptographic checksums. If a document hash changes after verification, the verification status is reopened and human verifiers are immediately notified.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
