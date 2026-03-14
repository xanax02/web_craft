export interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  description?: string;
}

export interface TypographySection {
  title: string;
  styles: TypographyStyle[];
}

export interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

export interface ColorSection {
  title:
    | "Primary Colours"
    | "Secondary & Accent Colours"
    | "UI Component Colors"
    | "Utility & Form Colors"
    | "Status & Feedback Colors";
  swatches: ColorSwatch[];
}

export interface StyleGuide {
  theme: string;
  description: string;
  colorSection: [
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection,
  ];
  typographySection: [TypographySection, TypographySection, TypographySection];
}
