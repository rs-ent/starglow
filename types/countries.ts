import countries from "i18n-iso-countries";

const codes = countries.getAlpha2Codes();
type ISO31661Alpha2 = keyof typeof codes;

export default ISO31661Alpha2;
