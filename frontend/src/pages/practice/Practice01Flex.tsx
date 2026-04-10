import Toolbar from "@/components/Toolbar";

export default function Practice01Flex() {
    return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
        <main className="container mx-auto px-6 py-10">
          <div className="flex  justify-between p-4 bg-gray-200 rounded ">
            <button className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-700 transition-colors">
              버튼1
            </button>
            <div className="bg-gray-300">111</div>
            <div>222</div>
          </div>
        </main>
    </div>
    );
}