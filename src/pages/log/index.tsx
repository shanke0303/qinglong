import { useState, useEffect, useCallback, Key, useRef } from 'react';
import { TreeSelect, Tree, Input } from 'antd';
import config from '@/utils/config';
import { PageContainer } from '@ant-design/pro-layout';
import Editor from '@monaco-editor/react';
import { request } from '@/utils/http';
import styles from './index.module.less';

function getFilterData(keyword: string, data: any) {
  const expandedKeys: string[] = [];
  if (keyword) {
    const tree: any = [];
    data.forEach((item: any) => {
      if (item.title.toLocaleLowerCase().includes(keyword)) {
        tree.push(item);
        expandedKeys.push(...item.children.map((x: any) => x.key));
      } else {
        const children: any[] = [];
        (item.children || []).forEach((subItem: any) => {
          if (subItem.title.toLocaleLowerCase().includes(keyword)) {
            children.push(subItem);
          }
        });
        if (children.length > 0) {
          tree.push({
            ...item,
            children,
          });
          expandedKeys.push(...children.map((x) => x.key));
        }
      }
    });
    return { tree, expandedKeys };
  }
  return { tree: data, expandedKeys };
}

const Log = () => {
  const [width, setWidth] = useState('100%');
  const [marginLeft, setMarginLeft] = useState(0);
  const [marginTop, setMarginTop] = useState(-72);
  const [title, setTitle] = useState('请选择日志文件');
  const [value, setValue] = useState('请选择日志文件');
  const [select, setSelect] = useState();
  const [data, setData] = useState<any[]>([]);
  const [filterData, setFilterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [height, setHeight] = useState<number>();
  const treeDom = useRef<any>();
  const [theme, setTheme] = useState<string>('');

  const getLogs = () => {
    setLoading(true);
    request
      .get(`${config.apiPrefix}logs`)
      .then((data) => {
        const result = formatData(data.dirs) as any;
        setData(result);
        setFilterData(result);
      })
      .finally(() => setLoading(false));
  };

  const formatData = (tree: any[]) => {
    return tree.map((x) => {
      x.title = x.name;
      x.value = x.name;
      x.disabled = x.isDir;
      x.key = x.name;
      x.children = x.files.map((y: string) => ({
        title: y,
        value: `${x.name}/${y}`,
        key: `${x.name}/${y}`,
        parent: x.name,
        isLeaf: true,
      }));
      return x;
    });
  };

  const getLog = (node: any) => {
    request.get(`${config.apiPrefix}logs/${node.value}`).then((data) => {
      setValue(data.data);
    });
  };

  const onSelect = (value: any, node: any) => {
    setSelect(value);
    setTitle(node.parent || node.value);
    getLog(node);
  };

  const onTreeSelect = useCallback((keys: Key[], e: any) => {
    onSelect(keys[0], e.node);
  }, []);

  const onSearch = useCallback(
    (e) => {
      const keyword = e.target.value;
      const { tree } = getFilterData(keyword.toLocaleLowerCase(), data);
      setFilterData(tree);
    },
    [data, setFilterData],
  );

  useEffect(() => {
    if (document.body.clientWidth < 768) {
      setWidth('auto');
      setMarginLeft(0);
      setMarginTop(0);
      setIsPhone(true);
    } else {
      setWidth('100%');
      setMarginLeft(0);
      setMarginTop(-72);
      setIsPhone(false);
    }
    getLogs();
    setHeight(treeDom.current.clientHeight);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const storageTheme = localStorage.getItem('qinglong_dark_theme');
    const isDark =
      (media.matches && storageTheme !== 'light') || storageTheme === 'dark';
    setTheme(isDark ? 'vs-dark' : 'vs');
    media.addEventListener('change', (e) => {
      if (storageTheme === 'auto' || !storageTheme) {
        if (e.matches) {
          setTheme('vs-dark');
        } else {
          setTheme('vs');
        }
      }
    });
  }, []);

  return (
    <PageContainer
      className="ql-container-wrapper log-wrapper"
      title={title}
      loading={loading}
      extra={
        isPhone && [
          <TreeSelect
            className="log-select"
            value={select}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={data}
            placeholder="请选择日志文件"
            showSearch
            key="value"
            onSelect={onSelect}
          />,
        ]
      }
      header={{
        style: {
          padding: '4px 16px 4px 15px',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 20,
          marginTop,
          width,
          marginLeft,
        },
      }}
    >
      <div className={`${styles['log-container']}`}>
        {!isPhone && (
          <div className={styles['left-tree-container']}>
            <Input.Search
              className={styles['left-tree-search']}
              onChange={onSearch}
            ></Input.Search>
            <div className={styles['left-tree-scroller']} ref={treeDom}>
              <Tree
                className={styles['left-tree']}
                treeData={filterData}
                showIcon={true}
                height={height}
                showLine={{ showLeafIcon: true }}
                onSelect={onTreeSelect}
              ></Tree>
            </div>
          </div>
        )}
        <Editor
          language="shell"
          theme={theme}
          value={value}
          options={{
            readOnly: true,
            fontSize: 12,
            minimap: { enabled: width === '100%' },
            lineNumbersMinChars: 3,
            fontFamily: 'Source Code Pro',
            folding: false,
            glyphMargin: false,
            wordWrap: 'on',
          }}
          onChange={(val, ev) => {
            setValue((val as string).replace(/\r\n/g, '\n'));
          }}
        />
      </div>
    </PageContainer>
  );
};

export default Log;
