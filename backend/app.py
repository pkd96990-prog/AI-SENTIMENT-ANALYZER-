from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import datetime

app = Flask(__name__)
CORS(app)

# Load ML model and vectorizer
model = pickle.load(open("sentiment_model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

# In-memory history store
sentiment_history = []


@app.route("/")
def home():
    return "AI Customer Sentiment Analyzer API is running"


# -------------------------------
# SINGLE REVIEW PREDICTION
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict_sentiment():
    data = request.get_json()
    review = data.get("review", "")

    if not review:
        return jsonify({"error": "Review text is required"}), 400

    vector = vectorizer.transform([review])
    prediction = model.predict(vector)[0]
    probs = model.predict_proba(vector)[0]

    labels = model.classes_
    prob_dict = dict(zip(labels, probs))

    result = {
        "review": review,
        "label": prediction,
        "positive": round(prob_dict.get("Positive", 0), 2),
        "negative": round(prob_dict.get("Negative", 0), 2),
        "neutral": round(prob_dict.get("Neutral", 0), 2),
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    sentiment_history.append(result)
    return jsonify(result)


# -------------------------------
# BULK REVIEW ANALYSIS
# -------------------------------
@app.route("/bulk-predict", methods=["POST"])
def bulk_predict():
    data = request.get_json()
    reviews = data.get("reviews", [])

    if not reviews or not isinstance(reviews, list):
        return jsonify({"error": "List of reviews required"}), 400

    vectors = vectorizer.transform(reviews)
    predictions = model.predict(vectors)
    probs_list = model.predict_proba(vectors)

    results = []
    labels = model.classes_

    for review, label, probs in zip(reviews, predictions, probs_list):
        prob_dict = dict(zip(labels, probs))
        
        record = {
            "review": review,
            "label": label,
            "positive": round(prob_dict.get("positive", 0), 2),
            "negative": round(prob_dict.get("negative", 0), 2),
            "neutral": round(prob_dict.get("neutral", 0), 2),
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        sentiment_history.append(record)
        results.append(record)

    return jsonify({
        "total_reviews": len(results),
        "results": results
    })

# -------------------------------
# SENTIMENT HISTORY
# -------------------------------
@app.route("/history", methods=["GET"])
def get_history():
    return jsonify({
        "count": len(sentiment_history),
        "history": sentiment_history
    })


if __name__ == "__main__":
    app.run(debug=True)
