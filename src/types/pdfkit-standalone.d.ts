import PDFDocument from "pdfkit";

declare module "pdfkit/js/pdfkit.standalone" {
  export default PDFDocument;
}
