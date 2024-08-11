const TranslatedTextView = ({ translatedTexts }) => {
  return (
    <div className="user-info">
      <div className="translated-texts">
        {translatedTexts.map((text, index) => {
          const totalTexts = translatedTexts.length;
          const opacity = (index + 1) / totalTexts;
          const scale = 1 - index * 0.1;
          const fontSize = index === totalTexts - 1 ? 20 : 12;

          return (
            <div
              key={index}
              className="text-bubble"
              style={{ opacity, transform: `scale(${scale})`, fontSize }}
            >
              {text.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TranslatedTextView;
