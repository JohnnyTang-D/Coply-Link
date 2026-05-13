import { useEffect, useMemo, useState } from 'react';
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
  const [submissionInfo, setSubmissionInfo] = useState({
    count: 0,
    limit: 3,
    remaining: 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ message: '', tone: 'success' });
  const [fingerprint, setFingerprint] = useState(null);

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

      // 再加载指纹和提交次数
      try {
        const fp = await getFingerprint();
        if (!cancelled) {
          setFingerprint(fp);
        }

        const submissionData = await requestJson(`${API}/links/submission-count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp }),
        });

        if (!cancelled) {
          setSubmissionInfo(submissionData);
        }
      } catch {
        // 提交次数加载失败不影响链接显示
        if (!cancelled) {
          setSubmissionInfo({ count: 0, limit: 3, remaining: 3 });
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
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

    // 跳转到对应的APP
    jumpToApp(link.url);

    window.setTimeout(() => {
      setCopiedId(null);
      setCopiedTitle('');
    }, 900);
  };

  const handleSubmitPublic = async (event) => {
    event.preventDefault();

    if (!fingerprint) {
      setSubmitFeedback({ tone: 'danger', message: '指纹获取失败，请刷新页面重试' });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await requestJson(`${API}/links/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, ...submitForm }),
      });

      if (data.success) {
        setSubmitFeedback({ tone: 'success', message: `链接已添加！今日剩余提交次数：${data.remaining}` });
        setSubmitForm({ title: '', url: '', description: '' });
        setShowSubmitForm(false);
        setSubmissionInfo((prev) => ({
          ...prev,
          count: prev.count + 1,
          remaining: data.remaining,
        }));
        await loadLinks();
      } else {
        setSubmitFeedback({ tone: 'danger', message: data.error || '提交失败' });
      }
    } catch (err) {
      let errorMsg = '提交失败，请稍后重试';
      if (err.message?.includes('429')) {
        errorMsg = '今日提交次数已达上限，请联系管理员提交';
      }
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
          <MetricPill label="今日次数" value={`${submissionInfo.count}/${submissionInfo.limit}`} />
          <MetricPill
            label="状态"
            value={error ? '异常' : isLoading ? '加载中' : '已就绪'}
            tone={error ? 'danger' : 'success'}
          />
        </div>
      </HeroSection>

      {copiedTitle && <div className="copy-toast">已复制「{copiedTitle}」</div>}
      <Toast message={submitFeedback.message} tone={submitFeedback.tone} onClose={() => setSubmitFeedback({ message: '', tone: 'success' })} />

      {!error && !isLoading && submissionInfo.remaining > 0 && (
        <section className="glass-panel editor-panel">
          <div className="section-heading">
            <h2>自助提交</h2>
            <p>今日剩余 {submissionInfo.remaining} 次；描述可选</p>
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
            <button type="button" className="primary-button" onClick={() => setShowSubmitForm(true)}>
              添加链接
            </button>
          )}
        </section>
      )}

      {!error && !isLoading && submissionInfo.remaining === 0 && (
        <StatusCard
          title="今日提交次数已用完"
          description="同一设备+网络组合每日限制3次，请联系管理员在 /admin 页面添加"
          tone="muted"
        />
      )}

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
          {links.map((link) => (
            <LinkCard key={link.id} link={link} copied={copiedId === link.id} onCopy={handleCopy} />
          ))}
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