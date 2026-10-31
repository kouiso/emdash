const text = "👨‍👩‍👧";
console.log("length:", text.length);
console.log("code points:", [...text].length);
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
console.log("graphemes:", [...segmenter.segment(text)].length);
