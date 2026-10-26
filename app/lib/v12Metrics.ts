// Source: public/reports/evaluation_summary_v12.json, classification_report_v12.csv, external_*_v12_vs_v3.csv
export const v12Metrics = {
  "modelVersion": "v12",
  "modelName": "MobileNetV2",
  "classCount": 12,
  "trainImages": 1387,
  "validationImages": 460,
  "testImages": 464,
  "testCorrect": 459,
  "internalAccuracy": 98.92,
  "internalMacroF1": 98.84,
  "testLoss": 0.0379,
  "externalTestImages": 117,
  "externalTestCorrect": 57,
  "externalAccuracy": 48.72,
  "externalDisplayAccuracy": 43.59,
  "externalV3Accuracy": 45.3,
  "classNames": [
    "Bamboo Grass",
    "Betel Vine",
    "Hairy Basil",
    "Holy Basil",
    "Kaffer Lime",
    "Kitchen Mint",
    "Laurel Clockvine",
    "Mitragyna Speciosa",
    "Siam Weed",
    "Siamese Neem",
    "Tiger Herbal",
    "Wildbetal Leafbush"
  ],
  "reportRows": [
    {
      "name": "Bamboo Grass",
      "precision": 100.0,
      "recall": 96.97,
      "f1": 98.46,
      "support": 33
    },
    {
      "name": "Betel Vine",
      "precision": 95.24,
      "recall": 100.0,
      "f1": 97.56,
      "support": 40
    },
    {
      "name": "Hairy Basil",
      "precision": 100.0,
      "recall": 95.45,
      "f1": 97.67,
      "support": 22
    },
    {
      "name": "Holy Basil",
      "precision": 100.0,
      "recall": 94.74,
      "f1": 97.3,
      "support": 38
    },
    {
      "name": "Kaffer Lime",
      "precision": 97.56,
      "recall": 100.0,
      "f1": 98.77,
      "support": 40
    },
    {
      "name": "Kitchen Mint",
      "precision": 97.56,
      "recall": 100.0,
      "f1": 98.77,
      "support": 40
    },
    {
      "name": "Laurel Clockvine",
      "precision": 97.56,
      "recall": 100.0,
      "f1": 98.77,
      "support": 40
    },
    {
      "name": "Mitragyna Speciosa",
      "precision": 100.0,
      "recall": 100.0,
      "f1": 100.0,
      "support": 40
    },
    {
      "name": "Siam Weed",
      "precision": 100.0,
      "recall": 100.0,
      "f1": 100.0,
      "support": 60
    },
    {
      "name": "Siamese Neem",
      "precision": 100.0,
      "recall": 100.0,
      "f1": 100.0,
      "support": 31
    },
    {
      "name": "Tiger Herbal",
      "precision": 100.0,
      "recall": 100.0,
      "f1": 100.0,
      "support": 40
    },
    {
      "name": "Wildbetal Leafbush",
      "precision": 100.0,
      "recall": 97.5,
      "f1": 98.73,
      "support": 40
    }
  ],
  "externalRows": [
    {
      "name": "Bamboo Grass",
      "correct": 1,
      "total": 10,
      "accuracy": 10.0
    },
    {
      "name": "Betel Vine",
      "correct": 4,
      "total": 10,
      "accuracy": 40.0
    },
    {
      "name": "Hairy Basil",
      "correct": 4,
      "total": 10,
      "accuracy": 40.0
    },
    {
      "name": "Holy Basil",
      "correct": 2,
      "total": 9,
      "accuracy": 22.22
    },
    {
      "name": "Kaffer Lime",
      "correct": 9,
      "total": 9,
      "accuracy": 100.0
    },
    {
      "name": "Kitchen Mint",
      "correct": 5,
      "total": 10,
      "accuracy": 50.0
    },
    {
      "name": "Laurel Clockvine",
      "correct": 4,
      "total": 10,
      "accuracy": 40.0
    },
    {
      "name": "Mitragyna Speciosa",
      "correct": 7,
      "total": 10,
      "accuracy": 70.0
    },
    {
      "name": "Siam Weed",
      "correct": 3,
      "total": 10,
      "accuracy": 30.0
    },
    {
      "name": "Siamese Neem",
      "correct": 10,
      "total": 10,
      "accuracy": 100.0
    },
    {
      "name": "Tiger Herbal",
      "correct": 3,
      "total": 10,
      "accuracy": 30.0
    },
    {
      "name": "Wildbetal Leafbush",
      "correct": 5,
      "total": 9,
      "accuracy": 55.56
    }
  ],
  "confidenceThreshold": 60
} as const;
