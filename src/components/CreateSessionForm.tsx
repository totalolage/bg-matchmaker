export function CreateSessionForm() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Session</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Session Name</label>
          <input type="text" className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover">
          Create
        </button>
      </form>
    </div>
  );
}