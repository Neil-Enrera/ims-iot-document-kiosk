const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Read base template from Indigency template
const baseTemplatePath = path.join(__dirname, '../../uploads/templates/b859aef560ec92bf0fe03b4a4a7b2b24.docx');
const baseContent = fs.readFileSync(baseTemplatePath, 'binary');

// ==========================================
// 1. BARANGAY CLEARANCE TEMPLATE
// ==========================================
const clearanceXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:body>
    <!-- Top Header Banner -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
        </w:tblBorders>
        <w:tblLook w:val="04A0"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8640"/>
      </w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="9E2F2F"/>
            <w:tcMar>
              <w:top w:w="240" w:type="dxa"/>
              <w:bottom w:w="240" w:type="dxa"/>
              <w:left w:w="200" w:type="dxa"/>
              <w:right w:w="200" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:spacing w:line="280" w:lineRule="auto"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFFFFF"/>
                <w:sz w:val="24"/>
              </w:rPr>
              <w:t>REPUBLIC OF THE PHILIPPINES</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
              <w:br/>
              <w:t>Province of Bulacan</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
              <w:br/>
              <w:t>City of San Jose del Monte</w:t>
            </w:r>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFD700"/>
                <w:sz w:val="34"/>
              </w:rPr>
              <w:br/>
              <w:t>BARANGAY SAN MANUEL</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="16"/></w:rPr>
              <w:br/>
              <w:t>Contact No: 0997-604-5329 / 0950-249-7834 / Tel No: (044) 769-4279</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="D6A24A"/>
            <w:tcMar>
              <w:top w:w="60" w:type="dxa"/>
              <w:bottom w:w="60" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:line="60" w:lineRule="auto"/></w:pPr></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr></w:p>

    <!-- Document Title -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="200" w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t>BARANGAY CLEARANCE</w:t>
      </w:r>
    </w:p>

    <!-- Salutation -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="200" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>TO WHOM IT MAY CONCERN:</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 1: Residency Certification -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">This is to certify that, </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{full_name}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">, </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{age}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> years old, with residence and postal address at Block </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{block}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> Lot </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{lot}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{street}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> St., </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{subdivision}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>, Barangay San Manuel, City of San Jose Del Monte, Bulacan is a Bonafide resident of this barangay.</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 2: No Derogatory Record -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">As per records of this office, subject has </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:u w:val="single"/>
          <w:color w:val="C00000"/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>NO DEROGATORY RECORD.</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 3: Purpose -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">This certification is being issued upon request of the above-named person for </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{purpose}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> REQUIREMENT.</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 4: Issuance Date & Place -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="600"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">Issued this </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{day}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> day of </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{month}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">, </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{year}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> at Barangay San Manuel, City of San Jose Del Monte, Bulacan, Philippines.</w:t>
      </w:r>
    </w:p>

    <!-- Signatory Section -->
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:before="400" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>Hon. GILBERT A. BAPTISTA</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:br/>
        <w:t>Barangay Chairman</w:t>
      </w:r>
    </w:p>

    <w:p><w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr></w:p>

    <!-- Metadata Section (Issued At / Issued On / Control No) -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="280" w:lineRule="auto" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:t>Issued at: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>CSJDM, Bulacan</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>Issued on: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{day}} {{month}}, {{year}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>Control No.: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{control_number}}</w:t>
      </w:r>
    </w:p>

    <!-- Legal notes -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="240" w:lineRule="auto" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:i/><w:b/><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr>
        <w:t>*Not valid without official seal*</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:i/><w:b/><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr>
        <w:br/>
        <w:t>*Valid for 6 months from date of issue*</w:t>
      </w:r>
    </w:p>

    <!-- Bottom Footer Banner -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
        </w:tblBorders>
        <w:tblLook w:val="04A0"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8640"/>
      </w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="9E2F2F"/>
            <w:tcMar>
              <w:top w:w="160" w:type="dxa"/>
              <w:bottom w:w="160" w:type="dxa"/>
              <w:left w:w="200" w:type="dxa"/>
              <w:right w:w="200" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:spacing w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFFFFF"/>
                <w:sz w:val="18"/>
              </w:rPr>
              <w:t>Barangay San Manuel • City of San Jose del Monte • brgy.sanmanuel1991@gmail.com</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const zipClearance = new PizZip(baseContent);
zipClearance.file('word/document.xml', clearanceXml);
const bufferClearance = zipClearance.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

// ==========================================
// 2. BARANGAY PERMIT TEMPLATE
// ==========================================
const permitXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:body>
    <!-- Top Header Banner -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
        </w:tblBorders>
        <w:tblLook w:val="04A0"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8640"/>
      </w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="9E2F2F"/>
            <w:tcMar>
              <w:top w:w="240" w:type="dxa"/>
              <w:bottom w:w="240" w:type="dxa"/>
              <w:left w:w="200" w:type="dxa"/>
              <w:right w:w="200" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:spacing w:line="280" w:lineRule="auto"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFFFFF"/>
                <w:sz w:val="24"/>
              </w:rPr>
              <w:t>REPUBLIC OF THE PHILIPPINES</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
              <w:br/>
              <w:t>Province of Bulacan</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
              <w:br/>
              <w:t>City of San Jose del Monte</w:t>
            </w:r>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFD700"/>
                <w:sz w:val="34"/>
              </w:rPr>
              <w:br/>
              <w:t>BARANGAY SAN MANUEL</w:t>
            </w:r>
            <w:r>
              <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="16"/></w:rPr>
              <w:br/>
              <w:t>Contact No: 0997-604-5329 / 0950-249-7834 / Tel No: (044) 769-4279</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="D6A24A"/>
            <w:tcMar>
              <w:top w:w="60" w:type="dxa"/>
              <w:bottom w:w="60" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:line="60" w:lineRule="auto"/></w:pPr></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr></w:p>

    <!-- Document Title -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="200" w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t>BARANGAY PERMIT</w:t>
      </w:r>
    </w:p>

    <!-- Salutation -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="200" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>TO WHOM IT MAY CONCERN:</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 1: Authorization -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">This is to authorize, </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{applicant_name}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> with office address located at </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{office_address}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> will conduct </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{activity_type}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> OF </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{quantity_description}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> POLES along </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{street}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> st., </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>{{subdivision}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t>, Barangay San Manuel, San Jose Del Monte Bulacan.</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 2: Request of -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">This permit is being issued upon the request of </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{requested_by}}</w:t>
      </w:r>
    </w:p>

    <!-- Body Paragraph 3: Given and signed -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:ind w:firstLine="720"/>
        <w:spacing w:line="360" w:lineRule="auto" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">Given and signed this </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{day}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> day of </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{month}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>{{year}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve"> at Barangay San Manuel, City of San Jose del Monte, Bulacan.</w:t>
      </w:r>
    </w:p>

    <!-- Note -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="280" w:lineRule="auto" w:before="200" w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:i/><w:b/><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>Note: Any violation(s) or illegal act(s) committed by a business will be cause for cancellation of this permit.</w:t>
      </w:r>
    </w:p>

    <!-- Signatory Section -->
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:before="300" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>GILBERT A. BAPTISTA</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:br/>
        <w:t>Barangay Chairman</w:t>
      </w:r>
    </w:p>

    <w:p><w:pPr><w:spacing w:before="200" w:after="200"/></w:pPr></w:p>

    <!-- Metadata Section -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="280" w:lineRule="auto" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:t>Issued at: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>CSJDM, Bulacan</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>Issued on: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{day}} {{month}}, {{year}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>Amount Paid: P </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{amount_paid}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>OR#: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{or_number}}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:br/>
        <w:t>Date: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/></w:rPr>
        <w:t>{{or_date}}</w:t>
      </w:r>
    </w:p>

    <!-- Legal notes -->
    <w:p>
      <w:pPr>
        <w:spacing w:line="240" w:lineRule="auto" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:i/><w:b/><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr>
        <w:t>*Not valid without official seal*</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:i/><w:b/><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr>
        <w:br/>
        <w:t>*Valid for 6 months from date of issue*</w:t>
      </w:r>
    </w:p>

    <!-- Bottom Footer Banner -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
        </w:tblBorders>
        <w:tblLook w:val="04A0"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8640"/>
      </w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="8640" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="9E2F2F"/>
            <w:tcMar>
              <w:top w:w="160" w:type="dxa"/>
              <w:bottom w:w="160" w:type="dxa"/>
              <w:left w:w="200" w:type="dxa"/>
              <w:right w:w="200" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:spacing w:line="240" w:lineRule="auto"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:color w:val="FFFFFF"/>
                <w:sz w:val="18"/>
              </w:rPr>
              <w:t>Barangay San Manuel • City of San Jose del Monte • brgy.sanmanuel1991@gmail.com</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const zipPermit = new PizZip(baseContent);
zipPermit.file('word/document.xml', permitXml);
const bufferPermit = zipPermit.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

// Save templates to disk
const uploadsDir = path.join(__dirname, '../../uploads/templates');
const publicDir = path.join(__dirname, '../../../public');

fs.writeFileSync(path.join(uploadsDir, 'Barangay-San-Manuel-Clearance-Template.docx'), bufferClearance);
fs.writeFileSync(path.join(publicDir, 'Barangay-San-Manuel-Clearance-Template.docx'), bufferClearance);
console.log('Saved Barangay-San-Manuel-Clearance-Template.docx');

fs.writeFileSync(path.join(uploadsDir, 'Barangay-San-Manuel-Permit-Template.docx'), bufferPermit);
fs.writeFileSync(path.join(publicDir, 'Barangay-San-Manuel-Permit-Template.docx'), bufferPermit);
console.log('Saved Barangay-San-Manuel-Permit-Template.docx');

// Verify rendering with docxtemplater
const testDocx = (name, buf, data) => {
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' } });
  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer' });
  console.log(`Verified ${name}: render OK (${outBuf.length} bytes)`);
};

testDocx('Clearance', bufferClearance, {
  full_name: 'Neil Andrei Enrera',
  age: '22',
  block: '12',
  lot: '34',
  street: 'Samaria',
  subdivision: 'Pleasant Hill Subd.',
  purpose: 'LOAN',
  day: '25th',
  month: 'August',
  year: '2026',
  control_number: 'CLR-2026-08-25-001'
});

testDocx('Permit', bufferPermit, {
  applicant_name: 'MERALCO / John Doe',
  office_address: 'CSJDM, Bulacan',
  activity_type: 'EXCAVATION/INSTALLATION/REPLACEMENT',
  quantity_description: '5 CONCRETE',
  street: 'Samaria',
  subdivision: 'Pleasant Hill Subd.',
  requested_by: 'Engr. Juan Dela Cruz',
  day: '25th',
  month: 'August',
  year: '2026',
  amount_paid: '500.00',
  or_number: 'OR-998812',
  or_date: 'August 25, 2026'
});
