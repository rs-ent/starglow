/// lib/utils/responsiveClass.ts

export const getResponsiveClass = (size: number) => {
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
        75: "w-[75px] h-[75px]  sm:w-[86px] sm:h-[86px]  md:w-[97px] md:h-[97px] lg:w-[108px] lg:h-[108px] xl:w-[119px] xl:h-[119px]",
        80: "w-[80px] h-[80px]  sm:w-[91px] sm:h-[91px]  md:w-[102px] md:h-[102px] lg:w-[113px] lg:h-[113px] xl:w-[124px] xl:h-[124px]",
        85: "w-[85px] h-[85px]  sm:w-[96px] sm:h-[96px]  md:w-[107px] md:h-[107px] lg:w-[118px] lg:h-[118px] xl:w-[129px] xl:h-[129px]",
        90: "w-[90px] h-[90px]  sm:w-[101px] sm:h-[101px]  md:w-[112px] md:h-[112px] lg:w-[123px] lg:h-[123px] xl:w-[134px] xl:h-[134px]",
        95: "w-[95px] h-[95px]  sm:w-[106px] sm:h-[106px]  md:w-[117px] md:h-[117px] lg:w-[128px] lg:h-[128px] xl:w-[139px] xl:h-[139px]",
        100: "w-[100px] h-[100px]  sm:w-[111px] sm:h-[111px]  md:w-[122px] md:h-[122px] lg:w-[133px] lg:h-[133px] xl:w-[144px] xl:h-[144px]",
        105: "w-[105px] h-[105px]  sm:w-[116px] sm:h-[116px]  md:w-[127px] md:h-[127px] lg:w-[138px] lg:h-[138px] xl:w-[149px] xl:h-[149px]",
        110: "w-[110px] h-[110px]  sm:w-[121px] sm:h-[121px]  md:w-[132px] md:h-[132px] lg:w-[143px] lg:h-[143px] xl:w-[154px] xl:h-[154px]",
        115: "w-[115px] h-[115px]  sm:w-[126px] sm:h-[126px]  md:w-[137px] md:h-[137px] lg:w-[148px] lg:h-[148px] xl:w-[159px] xl:h-[159px]",
        120: "w-[120px] h-[120px]  sm:w-[131px] sm:h-[131px]  md:w-[142px] md:h-[142px] lg:w-[153px] lg:h-[153px] xl:w-[164px] xl:h-[164px]",
        125: "w-[125px] h-[125px]  sm:w-[136px] sm:h-[136px]  md:w-[147px] md:h-[147px] lg:w-[158px] lg:h-[158px] xl:w-[169px] xl:h-[169px]",
        130: "w-[130px] h-[130px]  sm:w-[141px] sm:h-[141px]  md:w-[152px] md:h-[152px] lg:w-[163px] lg:h-[163px] xl:w-[174px] xl:h-[174px]",
        135: "w-[135px] h-[135px]  sm:w-[146px] sm:h-[146px]  md:w-[157px] md:h-[157px] lg:w-[168px] lg:h-[168px] xl:w-[179px] xl:h-[179px]",
        140: "w-[140px] h-[140px]  sm:w-[151px] sm:h-[151px]  md:w-[162px] md:h-[162px] lg:w-[173px] lg:h-[173px] xl:w-[184px] xl:h-[184px]",
        145: "w-[145px] h-[145px]  sm:w-[156px] sm:h-[156px]  md:w-[167px] md:h-[167px] lg:w-[178px] lg:h-[178px] xl:w-[189px] xl:h-[189px]",
        150: "w-[150px] h-[150px]  sm:w-[161px] sm:h-[161px]  md:w-[172px] md:h-[172px] lg:w-[183px] lg:h-[183px] xl:w-[194px] xl:h-[194px]",
    };

    const marginX = {
        5: "mx-[1px] sm:mx-[2px] md:mx-[3px] lg:mx-[4px] xl:mx-[5px]",
        10: "mx-[3px] sm:mx-[4px] md:mx-[5px] lg:mx-[6px] xl:mx-[7px]",
        15: "mx-[5px] sm:mx-[6px] md:mx-[7px] lg:mx-[8px] xl:mx-[10px]",
        20: "mx-[7px] sm:mx-[8px] md:mx-[10px] lg:mx-[12px] xl:mx-[14px]",
        25: "mx-[9px] sm:mx-[10px] md:mx-[12px] lg:mx-[14px] xl:mx-[16px]",
        30: "mx-[11px] sm:mx-[12px] md:mx-[14px] lg:mx-[16px] xl:mx-[18px]",
        35: "mx-[13px] sm:mx-[14px] md:mx-[16px] lg:mx-[18px] xl:mx-[20px]",
        40: "mx-[15px] sm:mx-[16px] md:mx-[18px] lg:mx-[20px] xl:mx-[22px]",
        45: "mx-[17px] sm:mx-[18px] md:mx-[20px] lg:mx-[22px] xl:mx-[24px]",
        50: "mx-[19px] sm:mx-[20px] md:mx-[22px] lg:mx-[24px] xl:mx-[26px]",
        55: "mx-[21px] sm:mx-[22px] md:mx-[24px] lg:mx-[26px] xl:mx-[28px]",
        60: "mx-[23px] sm:mx-[24px] md:mx-[26px] lg:mx-[28px] xl:mx-[30px]",
        65: "mx-[25px] sm:mx-[26px] md:mx-[28px] lg:mx-[30px] xl:mx-[32px]",
        70: "mx-[27px] sm:mx-[28px] md:mx-[30px] lg:mx-[32px] xl:mx-[34px]",
    };

    const marginY = {
        5: "my-[1px] sm:my-[2px] md:my-[3px] lg:my-[4px] xl:my-[5px]",
        10: "my-[3px] sm:my-[4px] md:my-[5px] lg:my-[6px] xl:my-[7px]",
        15: "my-[5px] sm:my-[6px] md:my-[7px] lg:my-[8px] xl:my-[10px]",
        20: "my-[7px] sm:my-[8px] md:my-[10px] lg:my-[12px] xl:my-[14px]",
        25: "my-[9px] sm:my-[10px] md:my-[12px] lg:my-[14px] xl:my-[16px]",
        30: "my-[11px] sm:my-[12px] md:my-[14px] lg:my-[16px] xl:my-[18px]",
        35: "my-[13px] sm:my-[14px] md:my-[16px] lg:my-[18px] xl:my-[20px]",
        40: "my-[15px] sm:my-[16px] md:my-[18px] lg:my-[20px] xl:my-[22px]",
        45: "my-[17px] sm:my-[18px] md:my-[20px] lg:my-[22px] xl:my-[24px]",
        50: "my-[19px] sm:my-[20px] md:my-[22px] lg:my-[24px] xl:my-[26px]",
        55: "my-[21px] sm:my-[22px] md:my-[24px] lg:my-[26px] xl:my-[28px]",
        60: "my-[23px] sm:my-[24px] md:my-[26px] lg:my-[28px] xl:my-[30px]",
        65: "my-[25px] sm:my-[26px] md:my-[28px] lg:my-[30px] xl:my-[32px]",
        70: "my-[27px] sm:my-[28px] md:my-[30px] lg:my-[32px] xl:my-[34px]",
    };

    const textClass = texts[size as keyof typeof texts];
    const paddingClass = paddings[size as keyof typeof paddings];
    const frameClass = frames[size as keyof typeof frames];
    const gapClass = gaps[size as keyof typeof gaps];
    const marginXClass = marginX[size as keyof typeof marginX];
    const marginYClass = marginY[size as keyof typeof marginY];

    return {
        textClass,
        paddingClass,
        frameClass,
        gapClass,
        marginXClass,
        marginYClass,
    };
};
