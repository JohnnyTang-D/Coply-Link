import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { MetricPill } from '../components/MetricPill';
import { StatusCard } from '../components/StatusCard';
import { LoadingCards } from '../components/LoadingCards';
import { LinkCard } from '../components/LinkCard';
import { Toast } from '../components/Toast';
import { API, shuffleArray, copyToClipboard, requestJson, getFingerprint, jumpToApp } from '../utils/api';

export function ViewPage() {
  const [links, setLinks] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedTitle, setCopiedTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: '', url: '', description: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ message: '', tone: 'success' });
  const [copiedUsers, setCopiedUsers] = useState([]);
  const navigate = useNavigate();

  const checkAuth = () => {
    const isAuthed = localStorage.getItem('isAuthed') === 'true';
    if (!isAuthed) {
      navigate('/login');
      return false;
    }
    return true;
  };


  const totalClicks = useMemo(
    () => links.reduce((sum, link) => sum + (link.clicks ?? 0), 0),
    [links],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      // 先加载links
      try {
        const linksData = await requestJson(`${API}/links`);
        if (!cancelled) {
          setLinks(shuffleArray(linksData));
          setError('');
        }
      } catch {
        if (!cancelled) {
          setError('链接列表加载失败，请检查服务是否已启动。');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // 检查并加载已复制的用户列表（每天0点失效）
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const storedDate = localStorage.getItem('copyDate');
    const storedUsers = JSON.parse(localStorage.getItem('copiedUserIds') || '[]');

    if (storedDate && storedDate !== today) {
      localStorage.removeItem('copiedUserIds');
      localStorage.removeItem('copyDate');
      setCopiedUsers([]);
    } else {
      setCopiedUsers(storedUsers);
    }
  }, []);


  const loadLinks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await requestJson(`${API}/links`);
      setLinks(shuffleArray(data));
    } catch {
      setError('链接列表加载失败，请检查服务是否已启动。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (link) => {
    if (!checkAuth()) return;
    const success = await copyToClipboard(link.url);
    if (!success) {
      prompt('自动复制失败，请手动复制：', link.url);
      return;
    }

    fetch(`${API}/links/${link.id}/click`, { method: 'POST' });
    setLinks((current) =>
      current.map((item) =>
        item.id === link.id ? { ...item, clicks: item.clicks + 1 } : item,
      ),
    );
    setCopiedId(link.id);
    setCopiedTitle(link.title);

    // 记录该用户的ID到本地已复制列表
    if (link.user_id) {
      setCopiedUsers(prev => {
        if (prev.includes(link.user_id)) return prev;
        const next = [...prev, link.user_id];
        localStorage.setItem('copiedUserIds', JSON.stringify(next));
        localStorage.setItem('copyDate', new Date().toLocaleDateString());
        return next;
      });
    }

    // 跳转到对应的APP
    jumpToApp(link.url);

    window.setTimeout(() => {
      setCopiedId(null);
      setCopiedTitle('');
    }, 900);
  };

  const handleSubmitPublic = async (event) => {
    event.preventDefault();
    if (!checkAuth()) return;

    setIsSubmitting(true);


    try {
      const username = localStorage.getItem('username');
      const data = await requestJson(`${API}/links/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...submitForm }),
      });

      if (data.success) {
        setSubmitFeedback({ tone: 'success', message: `链接已添加！` });
        setSubmitForm({ title: '', url: '', description: '' });
        setShowSubmitForm(false);
        await loadLinks();
      } else {
        setSubmitFeedback({ tone: 'danger', message: data.error || '提交失败' });
      }
    } catch (err) {
      let errorMsg = '提交失败，请稍后重试';
      setSubmitFeedback({ tone: 'danger', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page view-page">
      <HeroSection eyebrow="Shared board" title="互助链接池">
        <div className="metric-row">
          <MetricPill label="当前链接" value={isLoading ? '...' : links.length} />
          <MetricPill label="累计复制" value={isLoading ? '...' : totalClicks} />
          <MetricPill
            label="状态"
            value={error ? '异常' : isLoading ? '加载中' : '已就绪'}
            tone={error ? 'danger' : 'success'}
          />
        </div>
      </HeroSection>

      {copiedTitle && <div className="copy-toast">已复制「{copiedTitle}」</div>}
      <Toast message={submitFeedback.message} tone={submitFeedback.tone} onClose={() => setSubmitFeedback({ message: '', tone: 'success' })} />

      <section className="glass-panel editor-panel">
        <div className="section-heading">
          <h2>自助提交</h2>
          <p>描述可选；支持网址、文件路径和局域网地址。</p>
        </div>
        {showSubmitForm ? (
          <form className="submit-form" onSubmit={handleSubmitPublic}>
            <div className="form-grid">
              <input
                placeholder="标题"
                value={submitForm.title}
                onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                required
              />
              <input
                placeholder="地址"
                value={submitForm.url}
                onChange={(e) => setSubmitForm({ ...submitForm, url: e.target.value })}
                required
              />
              <textarea
                className="full-span"
                placeholder="描述（可选）"
                value={submitForm.description}
                onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '提交链接'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowSubmitForm(false)}>
                取消
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="primary-button" onClick={() => { if (checkAuth()) setShowSubmitForm(true); }}>
            添加链接
          </button>
        )}
      </section>

      {error ? (
        <StatusCard
          title="暂时无法读取链接"
          description={error}
          actionLabel="重新加载"
          onAction={loadLinks}
          tone="danger"
        />
      ) : isLoading ? (
        <LoadingCards />
      ) : links.length > 0 ? (
        <div className="links-grid">
          {links.map((link) => {
            const currentUserId = parseInt(localStorage.getItem('userId'));
            return (
              <LinkCard
                key={link.id}
                link={link}
                copied={copiedId === link.id || copiedUsers.includes(link.user_id)}
                isMine={link.user_id === currentUserId}
                onCopy={handleCopy}
              />
            );
          })}
        </div>
      ) : (
        <StatusCard
          title="还没有可用链接"
          description="管理员可以先到管理页添加几条链接，前台会自动用新的玻璃卡片样式展示。"
          tone="muted"
        />
      )}
    </main>
  );
}