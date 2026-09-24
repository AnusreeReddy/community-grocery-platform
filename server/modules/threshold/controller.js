import { runThresholdEvaluation, findMergeSuggestions } from "./service.js";

const evaluate = async (req, res) => {
  try {
    const result = await runThresholdEvaluation();

    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const mergeSuggestions = async (req, res) => {
  try {
    const suggestions = await findMergeSuggestions(req.params.id);

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { evaluate, mergeSuggestions };
