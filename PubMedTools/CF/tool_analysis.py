from dotenv import load_dotenv
import pandas as pd
import os
import shutil
from os import path
import gzip
import json
import re
import requests
import subprocess
import sys
load_dotenv(verbose=True)
import csv
from bs4 import BeautifulSoup

PTH = os.environ.get('PTH')

start = str(sys.argv[1])
end = str(sys.argv[2])
s = start.replace("/","")
en = end.replace("/","")

# test if url exists
def testURL(df):
  df['status']=''
  for i in range(0,len(df['tool_URL'])):
    url = df.iloc[i]['tool_URL']
    if isinstance(url, list):
      url = url[0].strip("'")
    print(i,url)
    try:
      request = requests.head(url,allow_redirects=False, timeout=5)
      status = request.status_code
    except:
      status = "error"
    df.at[i,'status'] = str(status)
  return(df)


def stringlist2list(str_list):
  if type(str_list) == float:
    return('')
  while any(isinstance(i, list) for i in str_list):
    str_list = str_list[0]
  if not isinstance(str_list, list):
    str_list = str_list.strip('[]') 
    str_list = str_list.strip("'")
    str_list = str_list.strip('"')
    str_list = str_list.split(",")
    str_list = [x for x in str_list if len(x) >0]
  return(str_list)


def get_value(data):
  if isinstance(data, list):
    if len(data) > 0:
      return(data[0].lower())
    else:
      return('')
  else:
    return(data.lower())

  
def is_tool(df):
  df['valid_tool'] = 'NA'
  whitelist = ['tool','tools','database','github', 'package','algorithm','amp.pharm.mssm.edu',
              'software','cran.r-project.org','.rar','.zip','gitlab','API','pypi.org','open source']
  #blacklist = ['WITHDRAWN']
  for i in range(0,len(df)):
    print(i)
    links = stringlist2list(df['tool_URL'].iloc[i])
    if len(df['tool_URL'].iloc[i]) == 0:
      df['valid_tool'].iloc[i] = '0'
      continue
    if 'WITHDRAWN' in df.iloc[i]['tool_name']:
      df['valid_tool'].iloc[i] = '0'
      continue
    if str(df['Article.Abstract.AbstractText'].iloc[i]) != 'nan':
      Abstract = get_value(df['Article.Abstract.AbstractText'].iloc[i])
      title = get_value(df['Article.ArticleTitle'].iloc[i])
      article_keywords = get_value(df['KeywordList'].iloc[i])
      URL = ' '.join(links)
      x = [word for word in whitelist if word in (Abstract +" "+ title +" "+ article_keywords +" "+ URL)]
      if len(x) > 0:
        df['valid_tool'].iloc[i] = '1' # this is a tool
  return(df)


# create data in BERT forma
def create_data_for_bert(df):
  if not os.path.exists(os.path.join(PTH,'bert/data/')):
    os.makedirs(os.path.join(PTH,'bert/data/'))
  # Creating test dataframe according to BERT format
  df_bert_test = pd.DataFrame({'index_col':df['PMID'],'text':df['Article.Abstract.AbstractText'].replace(r'\n',' ',regex=True)})
  # write file to disc
  df_bert_test.to_csv(os.path.join(PTH,'bert/data/test.tsv'), sep='\t', index=False, header=True)
  df.to_csv(os.path.join(PTH,'bert/data/full_data.csv'), index=False, header=True)
  print("file for bert saved in " + os.path.join(PTH,'bert/data/test.tsv'))
 

def fix_tool_name(df):
  z = len(df)
  for i in range(0,z):
    print(i, 'out of', z)
    tool_name = df['tool_name'].iloc[i]
    # if tool_name is None continue
    if type(tool_name) == float:
      continue
    if isinstance(tool_name, list):
      tool_name = ' '.join(tool_name)
    if len(tool_name.split(',')) > 1:
      if isinstance(df['tool_URL'].iloc[i], list):
        URL = df['tool_URL'].iloc[i][0]
      else:
        URL = df['tool_URL'].iloc[i]
      URL = URL.split('/')
      URL = [j for j in URL if j] # remove empty strings
      if len(URL)>0:
        x = URL[len(URL)-1]
        df['tool_name'].iloc[i] = x[:x.find(".htm")]
  df['tool_name'] = df['tool_name'].str.replace("[", "")
  df['tool_name'] = df['tool_name'].str.replace("]", "")
  df['tool_name'] = df['tool_name'].str.strip("'")
  return(df)


def pritify(df):
  tmp = []
  for i in range(0,len(df)):
    flg = 0
    x = stringlist2list(df.iloc[i]['tool_URL'])
    print(i)
    if any(isinstance(i, list) for i in x):
      tmp.append( [item for sublist in x for item in sublist] )
      flg = 1
    if len(x) == 1:
      tmp.append( x[0].strip() )
      flg = 1
    if flg == 0:
      tmp.append(x)
  del df['tool_URL']
  df['tool_URL'] = tmp
  return(df)


def clean(df):
  df['Article.Abstract.AbstractText'] = [ BeautifulSoup(str(x), "lxml").text for x in df['Article.Abstract.AbstractText'] ]
  df['Article.ArticleTitle'] = [ BeautifulSoup(str(x), "lxml").text for x in df['Article.ArticleTitle'] ]
  df['tool_description'] = [ BeautifulSoup(str(x), "lxml").text for x in df['tool_description'] ]
  # delete non alphanomeric characters but keep those in the keeplist
  keeplist = " =./" #characters to keep in url
  df['Article.Abstract.AbstractText'] =[ re.sub(r'[^\w'+keeplist+']', '',x) for x in df['Article.Abstract.AbstractText'] ]
  df['Article.ArticleTitle'] =[ re.sub(r'[^\w'+keeplist+']', '',x) for x in df['Article.ArticleTitle'] ]
  df['tool_description'] =[ re.sub(r'[^\w'+keeplist+']', '',x) for x in df['tool_description'] ]
  return(df)


def keep_first_link(df):
  pattern = re.compile(r"[^a-zA-Z0-9-//?.]+")
  links=[]
  # keep only first link
  for i in range(0,len(df)):
    if isinstance(df.at[i,'tool_URL'], list):
      url = df.at[i,'tool_URL'][0]
    else:
      url = (df.at[i,'tool_URL']).split(",")[0]
    url = url[url.find("http"):]
    index = url.rfind('.')
    url = url[:index+1]+pattern.sub('', url[index:])
    url = url.strip(".")
    url = url.replace("..",".")
    url = url.replace("https//",'https://')
    url = url.replace("http//",'http://')
    links.append(url)
  return(links)


if __name__=='__main__':
  df = pd.read_csv(os.path.join(PTH,"data/tools_"+s+"_"+en+".csv"),dtype=str)
  df = clean(df)
  df = df.reset_index()
  # create data for bert
  create_data_for_bert(df)
  # classify with bert
  subprocess.call([os.path.join(PTH,'BERT.sh')])
  # read bert results
  full_data = pd.read_csv(os.path.join(PTH,'bert/data/full_data.csv'),dtype=str, engine='python')
  test_results_p = pd.read_csv(os.path.join(PTH ,"bert/bert_output/test_results.tsv"),sep="\t",header=None) # load BERT class likelihood.
  # decide a class for each tweet based on BERT class likelihood score.
  test_results = pd.DataFrame({'is_tools_bert':test_results_p.idxmax(axis=1)}) 
  test_results = pd.concat([test_results.reset_index(drop=True), full_data], axis=1)
  # keep only tools that bert found
  df = test_results[test_results['is_tools_bert']==1]
  df = df.reset_index()
  # keep only tools with abstract+title+url with a whitelist-words AND without a blacklist-words.
  df = is_tool(df)
  df = df[df['valid_tool']!='0'] # labels: 
                                 #  1) "NA": might be a tool
                                 #  2) "1": is a tool 
                                 #  3) "0": NOT-tools
  df = pritify(df) # flate url list
  df = df[pd.notna(df['tool_URL'])]
  df = df[df.astype(str)['tool_URL'] != '[]']
  # keep only the first url
  df['tool_URL'] = keep_first_link(df)
  df = df[~df['tool_URL'].isna()]
  df['tool_URL'] = [ x.replace("..",".") for x in df['tool_URL'] ]
  df = testURL(df) # test if url loads
  df = df.dropna(subset=['tool_URL'])
  df = fix_tool_name(df)
  df.to_csv(os.path.join(PTH,'data/classified_tools_'+s+'_'+en+'.csv'),index=None)
