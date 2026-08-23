const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const buildDocumentXml = () => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  mc:Ignorable="w14 wp">
  <w:body>

    <!-- ======================================================== -->
    <!-- FRONT OF CARD                                            -->
    <!-- ======================================================== -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="24"/></w:rPr>
        <w:t>BARANGAY IDENTIFICATION CARD — FRONT</w:t>
      </w:r>
    </w:p>

    <!-- Outer Front Card Table Container (Standard CR80 ID Proportion) -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="14256" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:left w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:bottom w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:right w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
        </w:tblBorders>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/>
          <w:left w:w="0" w:type="dxa"/>
          <w:bottom w:w="0" w:type="dxa"/>
          <w:right w:w="0" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="14256"/>
      </w:tblGrid>

      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="14256" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
          </w:tcPr>

          <!-- 1. Header Banner Table -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="2200"/>
              <w:gridCol w:w="7800"/>
              <w:gridCol w:w="4256"/>
            </w:tblGrid>

            <w:tr>
              <!-- Left Seal / Emblem -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="2200" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="D92638"/>
                  <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFDC50"/><w:sz w:val="36"/></w:rPr>
                    <w:t>◉</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="14"/></w:rPr>
                    <w:br/>
                    <w:t>BRGY SAN MANUEL</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFDC50"/><w:sz w:val="12"/></w:rPr>
                    <w:br/>
                    <w:t>1991</w:t>
                  </w:r>
                </w:p>
              </w:tc>

              <!-- Center Official Header Details -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="7800" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="D92638"/>
                  <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="17"/></w:rPr>
                    <w:t>REPUBLIC OF THE PHILIPPINES</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="15"/></w:rPr>
                    <w:br/>
                    <w:t>Province of Bulacan • City of San Jose del Monte</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFDC50"/><w:sz w:val="28"/></w:rPr>
                    <w:br/>
                    <w:t>BARANGAY SAN MANUEL</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="13"/></w:rPr>
                    <w:br/>
                    <w:t>Contact: 0947 624 3229 • brgy.sanmanuel1991@gmail.com</w:t>
                  </w:r>
                </w:p>
              </w:tc>

              <!-- Right Card Title -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="4256" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="D92638"/>
                  <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:i/><w:color w:val="FFDC50"/><w:sz w:val="22"/></w:rPr>
                    <w:t>BARANGAY</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:i/><w:color w:val="FFDC50"/><w:sz w:val="22"/></w:rPr>
                    <w:br/>
                    <w:t>IDENTIFICATION</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:i/><w:color w:val="FFFFFF"/><w:sz w:val="22"/></w:rPr>
                    <w:br/>
                    <w:t>CARD</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 2. Golden Curved Accent Divider Bar -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid><w:gridCol w:w="14256"/></w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="14256" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FBBF24"/>
                </w:tcPr>
                <w:p><w:pPr><w:spacing w:after="0"/><w:line w:line="40" w:lineRule="exact"/></w:pPr></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 3. Main Body Table (Photo Box + Personal Information + QR Code) -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="3900"/>
              <w:gridCol w:w="6856"/>
              <w:gridCol w:w="3500"/>
            </w:tblGrid>

            <w:tr>
              <!-- Left Column: Resident Photo (2x2 Box) + Bearer Signature -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="3900" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tcMar>
                </w:tcPr>

                <!-- Photo Frame Table -->
                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="3700" w:type="dxa"/>
                    <w:jc w:val="center"/>
                    <w:tblBorders>
                      <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                      <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                      <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                      <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
                    </w:tblBorders>
                  </w:tblPr>
                  <w:tblGrid><w:gridCol w:w="3700"/></w:tblGrid>
                  <w:tr>
                    <w:tc>
                      <w:tcPr>
                        <w:tcW w:w="3700" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                        <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                      </w:tcPr>
                      <w:p>
                        <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr>
                          <w:t>PHOTO</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:color w:val="94A3B8"/><w:sz w:val="14"/></w:rPr>
                          <w:br/>
                          <w:t>2 × 2</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:i/></w:rPr>
                          <w:br/>
                          <w:t>{{resident_photo}}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>

                <!-- Bearer Signature -->
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:color w:val="0F172A"/><w:sz w:val="14"/></w:rPr>
                    <w:t>_________________________</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="13"/></w:rPr>
                    <w:br/>
                    <w:t>BEARER'S SIGNATURE</w:t>
                  </w:r>
                </w:p>
              </w:tc>

              <!-- Middle Column: Resident Personal Info -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="6856" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
                </w:tcPr>

                <!-- Name Group -->
                <w:p>
                  <w:pPr><w:spacing w:after="10"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="15"/></w:rPr>
                    <w:t>First Name, Middle Name, Surname, Suffix</w:t>
                  </w:r>
                </w:p>
                <w:p>
                  <w:pPr><w:spacing w:after="60"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="22"/></w:rPr>
                    <w:t>{{full_name}}</w:t>
                  </w:r>
                </w:p>

                <!-- Address Group -->
                <w:p>
                  <w:pPr><w:spacing w:after="10"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="15"/></w:rPr>
                    <w:t>Address</w:t>
                  </w:r>
                </w:p>
                <w:p>
                  <w:pPr><w:spacing w:after="60"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="18"/></w:rPr>
                    <w:t>{{address}}</w:t>
                  </w:r>
                </w:p>

                <!-- Place of Birth & Date of Birth Sub-Table -->
                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="6600" w:type="dxa"/>
                    <w:tblLayout w:type="fixed"/>
                    <w:tblBorders><w:none/></w:tblBorders>
                  </w:tblPr>
                  <w:tblGrid>
                    <w:gridCol w:w="3300"/>
                    <w:gridCol w:w="3300"/>
                  </w:tblGrid>
                  <w:tr>
                    <w:tc>
                      <w:tcPr><w:tcW w:w="3300" w:type="dxa"/></w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="10"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="15"/></w:rPr>
                          <w:t>Place of Birth</w:t>
                        </w:r>
                      </w:p>
                      <w:p>
                        <w:pPr><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="17"/></w:rPr>
                          <w:t>{{place_of_birth}}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                    <w:tc>
                      <w:tcPr><w:tcW w:w="3300" w:type="dxa"/></w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="10"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="15"/></w:rPr>
                          <w:t>Date of Birth</w:t>
                        </w:r>
                      </w:p>
                      <w:p>
                        <w:pPr><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="17"/></w:rPr>
                          <w:t>{{date_of_birth}}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>

              <!-- Right Column: Scannable Digital QR Code Box -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="3500" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="50" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>
                </w:tcPr>

                <!-- QR Frame Table -->
                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="3300" w:type="dxa"/>
                    <w:jc w:val="center"/>
                    <w:tblBorders>
                      <w:top w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                      <w:left w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                      <w:right w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                    </w:tblBorders>
                  </w:tblPr>
                  <w:tblGrid><w:gridCol w:w="3300"/></w:tblGrid>
                  <w:tr>
                    <w:tc>
                      <w:tcPr>
                        <w:tcW w:w="3300" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                        <w:tcMar><w:top w:w="50" w:type="dxa"/><w:left w:w="30" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="30" w:type="dxa"/></w:tcMar>
                      </w:tcPr>
                      <w:p>
                        <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="38"/></w:rPr>
                          <w:t>▣ ▦ ▣</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="38"/></w:rPr>
                          <w:br/>
                          <w:t>▦ ▣ ▦</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="38"/></w:rPr>
                          <w:br/>
                          <w:t>▣ ▦ ▣</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="64748B"/><w:sz w:val="12"/></w:rPr>
                          <w:br/>
                          <w:t>SCAN TO VERIFY</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 4. Footer Bar Table -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="4800"/>
              <w:gridCol w:w="9456"/>
            </w:tblGrid>
            <w:tr>
              <!-- ID Number -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="4800" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="18"/></w:rPr>
                    <w:t xml:space="preserve">ID NO.: </w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="18"/></w:rPr>
                    <w:t>{{id_number}}</w:t>
                  </w:r>
                </w:p>
              </w:tc>

              <!-- Social & Contact Strip -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="9456" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="D92638"/>
                  <w:tcMar><w:top w:w="50" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="13"/></w:rPr>
                    <w:t xml:space="preserve">www.facebook.com/BarangaySanManuelOfficial  •  </w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFDC50"/><w:sz w:val="13"/></w:rPr>
                    <w:t>Barangay San Manuel, City of San Jose del Monte</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- Page Break Between Front and Back of Card -->
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- ======================================================== -->
    <!-- BACK OF CARD                                             -->
    <!-- ======================================================== -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="24"/></w:rPr>
        <w:lastRenderedPageBreak/>
        <w:t>BARANGAY IDENTIFICATION CARD — BACK</w:t>
      </w:r>
    </w:p>

    <!-- Outer Back Card Table Container -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="14256" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:left w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:bottom w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
          <w:right w:val="single" w:sz="16" w:space="0" w:color="D92638"/>
        </w:tblBorders>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/>
          <w:left w:w="0" w:type="dxa"/>
          <w:bottom w:w="0" w:type="dxa"/>
          <w:right w:w="0" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="14256"/>
      </w:tblGrid>

      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="14256" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
          </w:tcPr>

          <!-- 1. Top Header Sub-Bar -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="7128"/>
              <w:gridCol w:w="7128"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="7128" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="16"/></w:rPr>
                    <w:t>BARANGAY IDENTIFICATION CARD</w:t>
                  </w:r>
                </w:p>
              </w:tc>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="7128" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:color w:val="64748B"/><w:sz w:val="14"/></w:rPr>
                    <w:t>www.facebook.com/BarangaySanManuelOfficial</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 2. Orange-to-Crimson Gradient Accent Bar -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid><w:gridCol w:w="14256"/></w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="14256" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="EA580C"/>
                </w:tcPr>
                <w:p><w:pPr><w:spacing w:after="0"/><w:line w:line="80" w:lineRule="exact"/></w:pPr></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 3. Back Body (Certification Details + Official Chairman Photo) -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="9456"/>
              <w:gridCol w:w="4800"/>
            </w:tblGrid>

            <w:tr>
              <!-- Left Column: Official Certification & Dates -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="9456" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                  <w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar>
                </w:tcPr>

                <!-- Certification Text -->
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                  <w:r>
                    <w:rPr><w:sz w:val="14"/><w:color w:val="1E293B"/></w:rPr>
                    <w:t>This is to certify that the bearer whose name, address and photo, appears on this card is a bonafide resident of this Barangay.</w:t>
                  </w:r>
                </w:p>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                  <w:r>
                    <w:rPr><w:sz w:val="14"/><w:color w:val="1E293B"/></w:rPr>
                    <w:t>Bearer has no derogatory records as of the issuance of this card.</w:t>
                  </w:r>
                </w:p>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                  <w:r>
                    <w:rPr><w:sz w:val="14"/><w:color w:val="1E293B"/></w:rPr>
                    <w:t>Any courtesy and assistance extended to him/her is highly appreciated.</w:t>
                  </w:r>
                </w:p>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
                  <w:r>
                    <w:rPr><w:i/><w:sz w:val="13"/><w:color w:val="64748B"/></w:rPr>
                    <w:t>If found, please return to the Office of the Barangay San Manuel</w:t>
                  </w:r>
                </w:p>

                <!-- Dates Sub-Table -->
                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="8800" w:type="dxa"/>
                    <w:tblLayout w:type="fixed"/>
                    <w:tblBorders><w:none/></w:tblBorders>
                  </w:tblPr>
                  <w:tblGrid>
                    <w:gridCol w:w="4400"/>
                    <w:gridCol w:w="4400"/>
                  </w:tblGrid>
                  <w:tr>
                    <w:tc>
                      <w:tcPr><w:tcW w:w="4400" w:type="dxa"/></w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="14"/></w:rPr>
                          <w:t xml:space="preserve">DATE ISSUED: </w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="14"/></w:rPr>
                          <w:t>{{date_issued}}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                    <w:tc>
                      <w:tcPr><w:tcW w:w="4400" w:type="dxa"/></w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="14"/></w:rPr>
                          <w:t xml:space="preserve">VALID UNTIL: </w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="14"/></w:rPr>
                          <w:t>{{valid_until}}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>

                <!-- Official Chairman Signature & Name -->
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="90" w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="24"/></w:rPr>
                    <w:t>GILBERT A. BAPTISTA</w:t>
                  </w:r>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="14"/></w:rPr>
                    <w:br/>
                    <w:t>BARANGAY CHAIRMAN</w:t>
                  </w:r>
                </w:p>
              </w:tc>

              <!-- Right Column: Official Portrait of Punong Barangay -->
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="4800" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FFFDF7"/>
                  <w:tcBorders>
                    <w:left w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                  </w:tcBorders>
                  <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
                </w:tcPr>

                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="4400" w:type="dxa"/>
                    <w:jc w:val="center"/>
                    <w:tblBorders>
                      <w:top w:val="single" w:sz="8" w:space="0" w:color="D92638"/>
                      <w:left w:val="single" w:sz="8" w:space="0" w:color="D92638"/>
                      <w:bottom w:val="single" w:sz="8" w:space="0" w:color="D92638"/>
                      <w:right w:val="single" w:sz="8" w:space="0" w:color="D92638"/>
                    </w:tblBorders>
                  </w:tblPr>
                  <w:tblGrid><w:gridCol w:w="4400"/></w:tblGrid>
                  <w:tr>
                    <w:tc>
                      <w:tcPr>
                        <w:tcW w:w="4400" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
                        <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                      </w:tcPr>
                      <w:p>
                        <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="28"/></w:rPr>
                          <w:t>⚖</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="14"/></w:rPr>
                          <w:br/>
                          <w:t>OFFICE OF THE</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="15"/></w:rPr>
                          <w:br/>
                          <w:t>PUNONG BARANGAY</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:color w:val="64748B"/><w:sz w:val="12"/></w:rPr>
                          <w:br/>
                          <w:t>Barangay San Manuel</w:t>
                        </w:r>
                        <w:r>
                          <w:rPr><w:color w:val="64748B"/><w:sz w:val="12"/></w:rPr>
                          <w:br/>
                          <w:t>CSJDM, Bulacan</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>
            </w:tr>
          </w:tbl>

          <!-- 4. Bottom Footer Strip -->
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="14256" w:type="dxa"/>
              <w:tblLayout w:type="fixed"/>
              <w:tblBorders><w:none/></w:tblBorders>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="7128"/>
              <w:gridCol w:w="7128"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="7128" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="D92638"/>
                  <w:tcMar><w:top w:w="40" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="13"/></w:rPr>
                    <w:t>BARANGAY SAN MANUEL</w:t>
                  </w:r>
                </w:p>
              </w:tc>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="7128" w:type="dxa"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="FBBF24"/>
                  <w:tcMar><w:top w:w="40" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr>
                  <w:r>
                    <w:rPr><w:b/><w:color w:val="D92638"/><w:sz w:val="13"/></w:rPr>
                    <w:t>OFFICIAL BARANGAY IDENTIFICATION</w:t>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>

        </w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>
      <w:pgMar w:top="648" w:right="792" w:bottom="648" w:left="792" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
};

const run = () => {
  const baseTemplatePath = path.join(__dirname, '../uploads/templates/12ee12af1cc360b6b94a60acaa182ac8.docx');
  const backupTemplatePath = path.join(__dirname, '../uploads/templates/12ee12af1cc360b6b94a60acaa182ac8.bak.docx');

  if (fs.existsSync(baseTemplatePath) && !fs.existsSync(backupTemplatePath)) {
    fs.copyFileSync(baseTemplatePath, backupTemplatePath);
    console.log('Backed up original template to:', backupTemplatePath);
  }

  const content = fs.readFileSync(baseTemplatePath, 'binary');
  const zip = new PizZip(content);

  const documentXml = buildDocumentXml();
  zip.file('word/document.xml', documentXml);

  const buffer = zip.generate({
    type: 'nodebuffer',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  fs.writeFileSync(baseTemplatePath, buffer);
  console.log('Successfully updated Barangay ID template:', baseTemplatePath);
};

run();
