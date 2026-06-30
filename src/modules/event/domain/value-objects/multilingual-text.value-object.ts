import { ValueObject } from '@libs/ddd';
import { Guard } from '@libs/guard';
import { ArgumentInvalidException } from '@libs/exceptions';

export interface MultilingualTextProps {
  vi: string;
  ja?: string;
}

/** Bilingual text (Việt–Nhật). Vietnamese is the required default language. */
export class MultilingualText extends ValueObject<MultilingualTextProps> {
  get vi(): string {
    return this.props.vi;
  }

  get ja(): string | undefined {
    return this.props.ja;
  }

  protected validate(props: MultilingualTextProps): void {
    if (Guard.isEmpty(props.vi)) {
      throw new ArgumentInvalidException('Vietnamese text (vi) is required');
    }
  }

  /** Pick a localized string, falling back to Vietnamese. */
  pick(lang: 'vi' | 'ja'): string {
    return lang === 'ja' ? this.props.ja ?? this.props.vi : this.props.vi;
  }

  static create(vi: string, ja?: string): MultilingualText {
    return new MultilingualText({ vi: vi.trim(), ja: ja?.trim() });
  }
}
