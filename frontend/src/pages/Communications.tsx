import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import Layout from '../components/Layout';

const Communications: React.FC = () => {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Aquí iría la lógica para enviar el email
    setTimeout(() => {
      alert('Mensaje enviado correctamente');
      setFormData({ recipients: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  const recentCommunications = [
    {
      id: 1,
      subject: 'Reminder: University Fair is next week',
      sent: '2 days ago',
    },
    {
      id: 2,
      subject: 'Welcome to the University Fair',
      sent: '1 week ago',
    },
    {
      id: 3,
      subject: 'University Fair Registration Open',
      sent: '2 weeks ago',
    },
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Mail size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Compose New Message</h3>
            <p className="text-gray-600 text-sm">
              Craft and send a new communication to your attendees.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              <select
                required
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Select recipients</option>
                <option value="all">All Attendees - University Fair</option>
                <option value="confirmed">Confirmed Attendees Only</option>
                <option value="pending">Pending Attendees Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Compose your message here"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={20} />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Recent Communications
          </h3>

          <div className="space-y-4">
            {recentCommunications.map((comm) => (
              <div
                key={comm.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Mail size={24} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{comm.subject}</h4>
                  <p className="text-sm text-gray-500">Sent: {comm.sent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Communications;
