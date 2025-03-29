/// lib/utils/responsiveClass.ts

export const getResponsiveClass = (
    size: number
) => {
    const texts = {
        5: "text-[8px]  sm:text-[9px]   md:text-[10px] lg:text-[12px]  xl:text-[13px]",
        10: "text-[9px]  sm:text-[10px] md:text-[12px] lg:text-[13px]  xl:text-[14px]",
        15: "text-[11px] sm:text-[13px] md:text-[14px] lg:text-[16px]  xl:text-[18px]",
        20: "text-[13px] sm:text-[15px] md:text-[17px] lg:text-[19px]  xl:text-[21px]",
        25: "text-[16px] sm:text-[18px] md:text-[21px] lg:text-[23px]  xl:text-[26px]",
        30: "text-[18px] sm:text-[21px] md:text-[23px] lg:text-[26px]  xl:text-[29px]",
        35: "text-[22px] sm:text-[25px] md:text-[29px] lg:text-[32px]  xl:text-[35px]",
        40: "text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px]  xl:text-[42px]",
        45: "text-[30px] sm:text-[35px] md:text-[39px] lg:text-[44px]  xl:text-[48px]",
        50: "text-[36px] sm:text-[41px] md:text-[47px] lg:text-[52px]  xl:text-[58px]",
        55: "text-[42px] sm:text-[48px] md:text-[55px] lg:text-[61px]  xl:text-[67px]",
        60: "text-[50px] sm:text-[57px] md:text-[65px] lg:text-[73px]  xl:text-[80px]",
        65: "text-[59px] sm:text-[68px] md:text-[77px] lg:text-[86px]  xl:text-[94px]",
        70: "text-[70px] sm:text-[81px] md:text-[91px] lg:text-[102px] xl:text-[112px]",
    };


    const paddings = {
        0: "px-0 py-0",
        1: "px-[1px] py-[1px] sm:px-[2px] sm:py-[1px] md:px-[3px] md:py-[1px] lg:px-[4px] lg:py-[2px] xl:px-[5px] xl:py-[2px]",
        5: "px-[3px] py-[1px] sm:px-[4px] sm:py-[1px] md:px-[6px] md:py-[2px] lg:px-[7px] lg:py-[2px] xl:px-[9px] xl:py-[3px]",
        10: "px-[6px] py-[2px] sm:px-[9px] sm:py-[3px] md:px-[12px] md:py-[4px] lg:px-[15px] lg:py-[5px] xl:px-[18px] xl:py-[6px]",
        15: "px-[9px] py-[3px] sm:px-[12px] sm:py-[4px] md:px-[15px] md:py-[6px] lg:px-[18px] lg:py-[7px] xl:px-[21px] xl:py-[8px]",
        20: "px-[12px] py-[4px] sm:px-[15px] sm:py-[6px] md:px-[18px] md:py-[8px] lg:px-[21px] lg:py-[10px] xl:px-[24px] xl:py-[12px]",
        25: "px-[15px] py-[6px] sm:px-[18px] sm:py-[8px] md:px-[21px] md:py-[10px] lg:px-[24px] lg:py-[12px] xl:px-[27px] xl:py-[14px]",
        30: "px-[18px] py-[7px] sm:px-[21px] sm:py-[10px] md:px-[24px] md:py-[12px] lg:px-[27px] lg:py-[14px] xl:px-[30px] xl:py-[16px]",
        35: "px-[20px] py-[8px] sm:px-[23px] sm:py-[12px] md:px-[26px] md:py-[14px] lg:px-[30px] lg:py-[16px] xl:px-[34px] xl:py-[18px]",
        40: "px-[22px] py-[10px] sm:px-[25px] sm:py-[14px] md:px-[28px] md:py-[16px] lg:px-[32px] lg:py-[18px] xl:px-[36px] xl:py-[20px]",
        45: "px-[24px] py-[11px] sm:px-[28px] sm:py-[15px] md:px-[32px] md:py-[17px] lg:px-[36px] lg:py-[19px] xl:px-[40px] xl:py-[22px]",
        50: "px-[26px] py-[12px] sm:px-[30px] sm:py-[16px] md:px-[34px] md:py-[18px] lg:px-[38px] lg:py-[20px] xl:px-[42px] xl:py-[24px]",
        55: "px-[28px] py-[13px] sm:px-[32px] sm:py-[18px] md:px-[36px] md:py-[20px] lg:px-[42px] lg:py-[22px] xl:px-[46px] xl:py-[26px]",
        60: "px-[30px] py-[14px] sm:px-[34px] sm:py-[20px] md:px-[38px] md:py-[22px] lg:px-[44px] lg:py-[24px] xl:px-[48px] xl:py-[28px]",
        65: "px-[32px] py-[16px] sm:px-[36px] sm:py-[22px] md:px-[40px] md:py-[24px] lg:px-[46px] lg:py-[26px] xl:px-[50px] xl:py-[30px]",
        70: "px-[34px] py-[18px] sm:px-[38px] sm:py-[24px] md:px-[42px] md:py-[26px] lg:px-[48px] lg:py-[28px] xl:px-[52px] xl:py-[32px]",
    };

    const gaps = {
        5: "gap-[4px]",
        10: "gap-[4px] sm:gap-[5px] md:gap-[6px] lg:gap-[7px] xl:gap-[8px]",
        15: "gap-[5px] sm:gap-[6px] md:gap-[7px] lg:gap-[8px] xl:gap-[10px]",
        20: "gap-[6px] sm:gap-[8px] md:gap-[10px] lg:gap-[12px] xl:gap-[14px]",
        25: "gap-[7px] sm:gap-[10px] md:gap-[12px] lg:gap-[14px] xl:gap-[16px]",
        30: "gap-[8px] sm:gap-[12px] md:gap-[14px] lg:gap-[16px] xl:gap-[18px]",
        35: "gap-[9px] sm:gap-[14px] md:gap-[16px] lg:gap-[18px] xl:gap-[20px]",
        40: "gap-[10px] sm:gap-[16px] md:gap-[18px] lg:gap-[20px] xl:gap-[22px]",
        45: "gap-[12px] sm:gap-[18px] md:gap-[20px] lg:gap-[22px] xl:gap-[24px]",
        50: "gap-[14px] sm:gap-[20px] md:gap-[22px] lg:gap-[24px] xl:gap-[24px]",
        55: "gap-[16px] sm:gap-[22px] md:gap-[24px] lg:gap-[24px] xl:gap-[24px]",
        60: "gap-[18px] sm:gap-[24px] md:gap-[24px] lg:gap-[24px] xl:gap-[24px]",
        65: "gap-[20px] sm:gap-[24px] md:gap-[24px] lg:gap-[24px] xl:gap-[24px]",
        70: "gap-[22px] sm:gap-[24px] md:gap-[24px] lg:gap-[24px] xl:gap-[24px]",
    };

    const frames = {
        5: "w-[8px]  h-[8px]   sm:w-[9px]  sm:h-[9px]   md:w-[10px] md:h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[13px] xl:h-[13px]",
        10: "w-[9px]  h-[9px]   sm:w-[10px] sm:h-[10px]  md:w-[12px] md:h-[12px] lg:w-[13px] lg:h-[13px] xl:w-[14px] xl:h-[14px]",
        15: "w-[11px] h-[11px]  sm:w-[13px] sm:h-[13px]  md:w-[14px] md:h-[14px] lg:w-[16px] lg:h-[16px] xl:w-[18px] xl:h-[18px]",
        20: "w-[13px] h-[13px]  sm:w-[15px] sm:h-[15px]  md:w-[17px] md:h-[17px] lg:w-[19px] lg:h-[19px] xl:w-[21px] xl:h-[21px]",
        25: "w-[16px] h-[16px]  sm:w-[18px] sm:h-[18px]  md:w-[21px] md:h-[21px] lg:w-[23px] lg:h-[23px] xl:w-[26px] xl:h-[26px]",
        30: "w-[18px] h-[18px]  sm:w-[21px] sm:h-[21px]  md:w-[23px] md:h-[23px] lg:w-[26px] lg:h-[26px] xl:w-[29px] xl:h-[29px]",
        35: "w-[22px] h-[22px]  sm:w-[25px] sm:h-[25px]  md:w-[29px] md:h-[29px] lg:w-[32px] lg:h-[32px] xl:w-[35px] xl:h-[35px]",
        40: "w-[26px] h-[26px]  sm:w-[30px] sm:h-[30px]  md:w-[34px] md:h-[34px] lg:w-[38px] lg:h-[38px] xl:w-[42px] xl:h-[42px]",
        45: "w-[30px] h-[30px]  sm:w-[35px] sm:h-[35px]  md:w-[39px] md:h-[39px] lg:w-[44px] lg:h-[44px] xl:w-[48px] xl:h-[48px]",
        50: "w-[36px] h-[36px]  sm:w-[41px] sm:h-[41px]  md:w-[47px] md:h-[47px] lg:w-[52px] lg:h-[52px] xl:w-[58px] xl:h-[58px]",
        55: "w-[42px] h-[42px]  sm:w-[48px] sm:h-[48px]  md:w-[55px] md:h-[55px] lg:w-[61px] lg:h-[61px] xl:w-[67px] xl:h-[67px]",
        60: "w-[50px] h-[50px]  sm:w-[57px] sm:h-[57px]  md:w-[65px] md:h-[65px] lg:w-[73px] lg:h-[73px] xl:w-[80px] xl:h-[80px]",
        65: "w-[59px] h-[59px]  sm:w-[68px] sm:h-[68px]  md:w-[77px] md:h-[77px] lg:w-[86px] lg:h-[86px] xl:w-[94px] xl:h-[94px]",
        70: "w-[70px] h-[70px]  sm:w-[81px] sm:h-[81px]  md:w-[91px] md:h-[91px] lg:w-[102px] lg:h-[102px] xl:w-[112px] xl:h-[112px]",
    };



    const textClass = texts[size as keyof typeof texts];
    const paddingClass = paddings[size as keyof typeof paddings];
    const frameClass = frames[size as keyof typeof frames];
    const gapClass = gaps[size as keyof typeof gaps];

    return {
        textClass,
        paddingClass,
        frameClass,
        gapClass,
    };
};