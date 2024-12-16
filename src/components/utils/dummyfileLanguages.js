import { useTranslation } from 'react-i18next';

const dummyfileLanguages = () => {
  const { t } = useTranslation();

  t('languages.en');
  t('languages.hi');
  t('languages.ru');
  t('languages.de');
  t('languages.zh');
  t('languages.ar');
  t('languages.mr');
};
