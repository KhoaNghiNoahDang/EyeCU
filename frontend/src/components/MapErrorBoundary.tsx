import React from "react";
export class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-600 rounded-xl w-full h-[240px]">
          <p className="font-bold text-sm">Bản đồ tạm thời không khả dụng</p>
          <p className="text-xs">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
