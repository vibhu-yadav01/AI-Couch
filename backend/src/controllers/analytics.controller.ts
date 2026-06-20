import { Response } from 'express';
import Analytics from '../models/Analytics';
import Interview from '../models/Interview';
import { AuthRequest } from '../types';

// GET /api/analytics/dashboard
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get total completed interviews
    const totalInterviews = await Interview.countDocuments({ userId, status: 'completed' });

    // Fetch all analytics for trends (oldest to newest)
    const analyticsData = await Analytics.find({ userId }).sort({ createdAt: 1 });

    // Calculate overall average score
    let averageScore = 0;
    if (analyticsData.length > 0) {
      const sum = analyticsData.reduce((acc, curr) => acc + curr.overallScore, 0);
      averageScore = Math.round(sum / analyticsData.length);
    }

    // Calculate skill averages
    const skillScores = {
      communication: 0,
      technical: 0,
      behavioral: 0,
      leadership: 0,
    };

    if (analyticsData.length > 0) {
      let commSum = 0;
      let techSum = 0;
      let behSum = 0;
      let leadSum = 0;

      analyticsData.forEach((item) => {
        commSum += item.communicationScore || 0;
        techSum += item.technicalScore || 0;
        behSum += item.behavioralScore || 0;
        leadSum += item.leadershipScore || 0;
      });

      skillScores.communication = Math.round(commSum / analyticsData.length);
      skillScores.technical = Math.round(techSum / analyticsData.length);
      skillScores.behavioral = Math.round(behSum / analyticsData.length);
      skillScores.leadership = Math.round(leadSum / analyticsData.length);
    }

    // Get trends (limit to last 10 entries)
    const last10Analytics = analyticsData.slice(-10);

    const confidenceTrend = last10Analytics.map((item) => ({
      date: item.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: item.confidenceScore,
    }));

    const scoreHistory = last10Analytics.map((item) => ({
      date: item.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: item.overallScore,
    }));

    const fillerWordTrend = last10Analytics.map((item) => ({
      date: item.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: item.fillerWordCount,
    }));

    // Fetch 5 most recent interviews
    const recentInterviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalInterviews,
        averageScore,
        skillScores,
        confidenceTrend,
        scoreHistory,
        fillerWordTrend,
        recentInterviews,
      },
    });
  } catch (err: any) {
    console.error('Get dashboard analytics error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// GET /api/analytics/interview/:id
export const getInterviewAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analytics = await Analytics.findOne({
      interviewId: req.params.id,
      userId: req.user?.id,
    });

    if (!analytics) {
      res.status(404).json({ success: false, error: 'Analytics for this interview not found' });
      return;
    }

    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
