# import torch.nn as nn
# from transformers import AutoModel

# class ClassificationModel(nn.Module):
#     def __init__(self, num_classes):
#         super(ClassificationModel, self).__init__()
#         self.bert = AutoModel.from_pretrained("nreimers/MiniLM-L6-H384-uncased")
#         self.classifier = nn.Linear(self.bert.config.hidden_size, num_classes)

#     def forward(self, input_ids, attention_mask=None, token_type_ids=None):
#         outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids)
#         cls_output = outputs.last_hidden_state[:, 0, :]  # [CLS] token
#         logits = self.classifier(cls_output)
#         return logits