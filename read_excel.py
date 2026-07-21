import sys
import pandas as pd

df = pd.read_excel('Feedback_Mentor.xlsx')
df.to_csv('feedback_temp.csv', index=False, encoding='utf-8')
