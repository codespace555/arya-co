declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
  }

  interface PDFResult {
    filePath?: string;
    base64?: string;
  }

  const RNHTMLtoPDF: {
    convert: (options: Options) => Promise<PDFResult>;
  };

  export default RNHTMLtoPDF;
}
