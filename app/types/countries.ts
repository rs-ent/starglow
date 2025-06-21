import countries from "i18n-iso-countries";

const _codes = countries.getAlpha2Codes();
type ISO31661Alpha2 = keyof typeof _codes;

export default ISO31661Alpha2;
